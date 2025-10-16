import { useState, useEffect } from 'react'; // --- FIX #1: Import useEffect ---
import { Heart, Send, Share2, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { useWallet } from './WalletProvider';
import { parseEther, type Address } from 'viem';
import { toast } from 'sonner';

export interface Story {
  id: string;
  content: string;
  author: string;
  authorAddress: Address;
  timestamp: Date;
  loves: number;
  views: number; // This will now come from StoryFeed as the real count
  loved: boolean;
}

interface StoryCardProps {
  story: Story;
  refetchStories: () => Promise<void>;
}

export const StoryCard = ({ story, refetchStories }: StoryCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // --- FIX #2: Add state to track if the view has been counted for this session ---
  const [hasBeenViewed, setHasBeenViewed] = useState(false);
  const { isConnected, sendCalls } = useWallet();
  const maxPreviewLength = 280;

  const needsExpansion = story.content.length > maxPreviewLength;
  const displayContent = needsExpansion && !isExpanded
    ? story.content.slice(0, maxPreviewLength) + '...'
    : story.content;

  // --- FIX #3: Add a useEffect to call the increment-view function ---
  useEffect(() => {
    // This effect runs once when the component mounts.
    // We check `hasBeenViewed` to prevent it from firing multiple times if the component re-renders.
    if (!hasBeenViewed) {
      const incrementViewCount = async () => {
        try {
          // Fire-and-forget call to our Supabase function. We don't need to wait for the response.
          fetch(import.meta.env.VITE_SUPABASE_INCREMENT_VIEW_URL, { // Ensure this URL is in your .env
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storyId: Number(story.id) }),
          });
          // Mark as viewed for this session so we don't call it again.
          setHasBeenViewed(true);
        } catch (error) {
          // We don't show an error to the user as this is a background task.
          console.error("Failed to increment view count:", error);
        }
      };
      
      // Add a small delay so this doesn't block the initial render.
      const timer = setTimeout(incrementViewCount, 500);
      return () => clearTimeout(timer);
    }
  }, [story.id, hasBeenViewed]);

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
      const { encodeFunctionData } = await import('viem');
      const { CONTRACT_ADDRESS, CONTRACT_ABI } = await import('../config');
      
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

  const handleTip = async () => {
    if (!isConnected || isProcessing) {
      if (!isConnected) toast.error('Please connect your wallet first');
      return;
    }
    
    setIsProcessing(true);
    try {
      const { encodeFunctionData, parseEther } = await import('viem');
      const { CONTRACT_ADDRESS, CONTRACT_ABI } = await import('../config');
      
      const calldata = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: 'tipStory',
        args: [BigInt(story.id)],
      });
      
      const tipAmount = parseEther('0.001'); // 0.001 ETH tip
      
      await sendCalls([{
        to: CONTRACT_ADDRESS,
        data: calldata,
        value: `0x${tipAmount.toString(16)}`,
      }]);
      
      toast.success('Tip sent! 💙');
      await refetchStories();
    } catch (error) {
      console.error('Failed to send tip:', error);
      toast.error('Failed to send tip');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <article className="bg-card border border-border rounded-2xl p-4 sm:p-5 md:p-6 transition-all hover:shadow-md">
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
          <span className="text-xs sm:text-sm">Tip</span>
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
          {/* --- FIX #4: Display the real view count passed in via props --- */}
          <span className="text-xs sm:text-sm">{story.views}</span>
        </div>
      </div>
    </article>
  );
};
