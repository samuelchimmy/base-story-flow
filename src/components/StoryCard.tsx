import { useState, useEffect } from 'react';
import { Heart, Send, Share2, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { useWallet } from './WalletProvider';
// --- FIX #1: Import `parseUnits` instead of `parseEther` ---
import { parseUnits, type Address, encodeFunctionData } from 'viem'; 
import { toast } from 'sonner';
// --- FIX #2: Import all necessary config from your updated config file ---
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDC_CONTRACT_ADDRESS, USDC_ABI } from '../config';
import { supabase } from '@/integrations/supabase/client';


export interface Story {
  id: string;
  content: string;
  author: string;
  authorAddress: Address;
  timestamp: Date;
  loves: number;
  views: number;
  loved: boolean;
  deleted?: boolean; // Add the optional deleted flag from the new contract
}

interface StoryCardProps {
  story: Story;
  refetchStories: () => Promise<void>;
}

export const StoryCard = ({ story, refetchStories }: StoryCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewCount, setViewCount] = useState(story.views);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);
  const { isConnected, sendCalls } = useWallet();
  const maxPreviewLength = 280;

  // Increment view count when story is viewed
  useEffect(() => {
    if (!hasBeenViewed) {
      const incrementView = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('increment-view', {
            body: { storyId: parseInt(story.id) },
          });

          if (error) {
            console.error('Error incrementing view:', error);
            return;
          }

          if (data?.viewCount) {
            setViewCount(data.viewCount);
          }
        } catch (error) {
          console.error('Failed to increment view:', error);
        }
      };

      incrementView();
      setHasBeenViewed(true);
    }
  }, [story.id, hasBeenViewed]);

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

  // --- FIX #3: Complete rewrite of the handleTip function for USDC ---
  const handleTip = async () => {
    if (!isConnected || isProcessing) {
      if (!isConnected) toast.error('Please connect your wallet first');
      return;
    }
    
    setIsProcessing(true);
    const tipToast = toast.loading('Preparing your tip...');
    
    try {
      // Define the tip amount - USDC has 6 decimals, so 0.1 USDC is 100,000
      const tipAmount = parseUnits('0.1', 6);

      // --- Step 1: Approve our smart contract to spend the user's USDC ---
      toast.loading('Please approve the USDC spending limit...', { id: tipToast });
      
      const approveCalldata = encodeFunctionData({
        abi: USDC_ABI, // Use the USDC ABI
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, tipAmount], // Arg1: Spender (our contract), Arg2: Amount
      });

      // Send the approval transaction TO the USDC contract
      await sendCalls([{
        to: USDC_CONTRACT_ADDRESS,
        data: approveCalldata,
      }]);
      
      toast.success('Approval successful! Now sending your tip...', { id: tipToast });

      // --- Step 2: Call our smart contract to execute the tip ---
      const tipCalldata = encodeFunctionData({
        abi: CONTRACT_ABI, // Use our BaseStory ABI
        functionName: 'tipStory', // The new function in our contract
        args: [BigInt(story.id)],
      });

      // Send the tipping transaction TO our BaseStory contract
      await sendCalls([{
        to: CONTRACT_ADDRESS,
        data: tipCalldata,
      }]);
      
      toast.success('Tip sent successfully! Thank you. 💙', { id: tipToast });
      await refetchStories();

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

  // If story is marked as deleted, don't render it
  if (story.deleted) {
    return null;
  }

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
            className={`mt-2 p-0 h-auto text-xs sm:text-sm ${
              isExpanded ? 'text-white hover:text-white/80' : 'text-primary hover:text-primary/80'
            }`}
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
          <span className="text-xs sm:text-sm">{viewCount}</span>
        </div>
      </div>
    </article>
  );
};
