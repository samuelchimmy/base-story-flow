import { useState, useEffect } from 'react';
import { Heart, Send, Share2, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { useWallet } from './WalletProvider';
import { parseUnits, type Address, encodeFunctionData } from 'viem'; 
import { toast } from 'sonner';
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDC_CONTRACT_ADDRESS, USDC_ABI } from '../config';


export interface Story {
  id: string;
  content: string;
  author: string;
  authorAddress: Address;
  timestamp: Date;
  loves: number;
  views: number;
  loved: boolean;
  deleted?: boolean; 
}

interface StoryCardProps {
  story: Story;
  refetchStories: () => Promise<void>;
}

export const StoryCard = ({ story, refetchStories }: StoryCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isConnected, sendCalls } = useWallet();
  const maxPreviewLength = 280;

  // --- PRESERVED: Your commented-out view count logic remains untouched ---
  // const [hasBeenViewed, setHasBeenViewed] = useState(false);
  // useEffect(() => { ... }, []);

  const needsExpansion = story.content.length > maxPreviewLength;
  const displayContent = needsExpansion && !isExpanded
    ? story.content.slice(0, maxPreviewLength) + '...'
    : story.content;

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m ago`;
  };

  const handleShare = () => {
    const url = window.location.href + `?story=${story.id}`;
    const text = `Check out this story on BaseStory: ${story.content.slice(0, 100)}...`;
    
    const shareOptions = [
      {
        name: 'Twitter',
        url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      },
      {
        name: 'Farcaster',
        url: `https://warpcast.com/~/compose?text=${encodeURIComponent(text + ' ' + url)}`,
      },
    ];

    window.open(shareOptions[0].url, '_blank');
  };

  const handleLove = async () => {
    if (!isConnected || isProcessing) {
      if (!isConnected) toast.error('Please connect your wallet first');
      return;
    }
    
    setIsProcessing(true);
    try {
      const calldata = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: 'loveStory',
        args: [BigInt(story.id)],
      });
      
      await sendCalls([{
        to: CONTRACT_ADDRESS,
        data: calldata,
      }]);
      
      toast.success('Story loved! 💙');
      await refetchStories();
    } catch (error) {
      console.error('Failed to love story:', error);
      toast.error('Failed to love story. You may have already loved it.');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- THIS IS THE ONLY FUNCTION THAT HAS BEEN REPLACED ---
  const handleTip = async () => {
    if (!isConnected || isProcessing) {
      if (!isConnected) toast.error('Please connect your wallet first');
      return;
    }
    
    setIsProcessing(true);
    const tipToast = toast.loading('Preparing your 0.1 USDC tip...');
    
    try {
      const tipAmount = parseUnits('0.1', 6);
      
      // Use the minimal USDC ABI for the `transfer` function, as the demo app does.
      const transferAbi = [{"inputs":[{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}] as const;

      // Encode the direct `transfer` call to the story's author.
      const transferCalldata = encodeFunctionData({
        abi: transferAbi,
        functionName: 'transfer',
        args: [story.authorAddress, tipAmount],
      });

      // Also encode the call to increment our own contract's tip counter.
      const incrementTipCountCalldata = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: 'tipStory',
        args: [BigInt(story.id)],
      });

      // Batch both calls into a single `sendCalls` request.
      // This is the key: the SDK will see the `transfer` call in the batch,
      // detect the insufficient USDC balance, and trigger the permission checkbox.
      await sendCalls([
        { 
          to: USDC_CONTRACT_ADDRESS, // First call: Transfer USDC
          data: transferCalldata 
        },
        { 
          to: CONTRACT_ADDRESS, // Second call: Increment our contract's counter
          data: incrementTipCountCalldata 
        }
      ]);
      
      toast.success('Tip sent successfully! Thank you. 💙', { id: tipToast });
      setTimeout(() => refetchStories(), 2000);

    } catch (error) {
      console.error('Failed to send tip:', error);
      toast.error('Failed to send tip.', {
        id: tipToast,
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  // --- END OF REPLACED FUNCTION ---

  if (story.deleted) {
    return null;
  }

  return (
    <article className="bg-card border border-border rounded-2xl p-4 sm:p-5 md:p-6 transition-all hover:shadow-md">
      {/* ALL of your original JSX is preserved below */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <span className="text-sm sm:text-base font-medium text-muted-foreground">
            {story.author.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm sm:text-base text-foreground">
              {story.author}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(story.timestamp)}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap break-words">
          {displayContent}
        </p>
        {needsExpansion && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-primary hover:text-primary/80 p-0 h-auto text-xs sm:text-sm"
          >
            {isExpanded ? 'Show Less' : 'View More'}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-4 text-muted-foreground">
        <button
          onClick={handleLove}
          className="flex items-center gap-1.5 sm:gap-2 transition-colors hover:text-primary group"
          aria-label="Love story"
        >
          <Heart
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-all ${
              story.loved ? 'fill-primary text-primary' : 'group-hover:scale-110'
            }`}
          />
          <span className="text-xs sm:text-sm">{story.loves}</span>
        </button>

        <button
          onClick={handleTip}
          className="flex items-center gap-1.5 sm:gap-2 transition-colors hover:text-primary group"
          aria-label="Tip author"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
          <span className="text-xs sm:text-sm">Tip 0.1 USDC</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 sm:gap-2 transition-colors hover:text-primary group"
          aria-label="Share story"
        >
          <Share2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
          <span className="text-xs sm:text-sm">Share</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm">{story.views}</span>
        </div>
      </div>
    </article>
  );
};
