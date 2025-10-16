import { useState, useEffect } from 'react';
import { Heart, Send, Share2, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { useWallet } from './WalletProvider';
import { type Address, encodeFunctionData, parseUnits } from 'viem'; // Updated imports
import { toast } from 'sonner';
// --- FIX #1: Import USDC contract details for tipping ---
import { USDC_CONTRACT_ADDRESS, USDC_ABI } from '../config';

export interface Story {
  id: string;
  content: string;
  author: string;
  authorAddress: Address;
  timestamp: Date;
  loves: number;
  views: number;
  loved: boolean;
}

interface StoryCardProps {
  story: Story;
  refetchStories: () => Promise<void>;
}

export const StoryCard = ({ story, refetchStories }: StoryCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);
  const { isConnected, sendCalls } = useWallet();
  const maxPreviewLength = 280;

  const needsExpansion = story.content.length > maxPreviewLength;
  const displayContent = needsExpansion && !isExpanded
    ? story.content.slice(0, maxPreviewLength) + '...'
    : story.content;

  // --- HARDENED VIEW COUNT LOGIC ---
  useEffect(() => {
    const viewCountUrl = import.meta.env.VITE_SUPABASE_INCREMENT_VIEW_URL;

    // Only run if the URL is configured and the view hasn't been counted this session
    if (viewCountUrl && !hasBeenViewed) {
      const incrementViewCount = async () => {
        try {
          fetch(viewCountUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storyId: Number(story.id) }),
          });
          setHasBeenViewed(true);
        } catch (error) {
          console.error("Failed to increment view count:", error);
        }
      };
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

  const handleShare = () => { /* ... same as before ... */ };

  const handleLove = async () => {
    if (!isConnected || isProcessing) {
      if (!isConnected) toast.error('Please connect your wallet first');
      return;
    }
    setIsProcessing(true);
    try {
      const { CONTRACT_ADDRESS, CONTRACT_ABI } = await import('../config');
      const calldata = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: 'loveStory',
        args: [BigInt(story.id)],
      });
      await sendCalls([{ to: CONTRACT_ADDRESS, data: calldata }]);
      toast.success('Story loved! 💙');
      await refetchStories();
    } catch (error) {
      console.error('Failed to love story:', error);
      toast.error('Failed to love story. You may have already loved it.');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RE-ARCHITECTED handleTip FOR USDC ---
  const handleTip = async () => {
    if (!isConnected || isProcessing) {
      if (!isConnected) toast.error('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);
    const tipToast = toast.loading('Preparing your tip...');

    try {
      // Import config inside the function to avoid module-level scope issues
      const { CONTRACT_ADDRESS, CONTRACT_ABI } = await import('../config');
      
      // Define the tip amount - USDC has 6 decimals
      const tipAmount = parseUnits('0.1', 6); // Tip 0.1 USDC

      // Step 1: Approve our smart contract to spend the user's USDC
      toast.loading('Please approve the USDC spending limit...', { id: tipToast });
      const approveCalldata = encodeFunctionData({
        abi: USDC_ABI, // Use the USDC ABI
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, tipAmount], // Arg1: Spender, Arg2: Amount
      });

      // Send the approval transaction to the USDC contract
      await sendCalls([{
        to: USDC_CONTRACT_ADDRESS, // The transaction goes TO the USDC contract
        data: approveCalldata,
      }]);
      toast.success('Approval successful! Now sending your tip...', { id: tipToast });

      // Step 2: Call our smart contract to execute the tip (transferFrom)
      // NOTE: This requires a new function in your smart contract.
      // We will assume it's named 'tipStoryWithUSDC'.
      const tipCalldata = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: 'tipStoryWithUSDC', // The new function in your contract
        args: [BigInt(story.id), tipAmount],
      });

      // Send the tipping transaction to our BaseStory contract
      await sendCalls([{
        to: CONTRACT_ADDRESS, // This transaction goes TO our contract
        data: tipCalldata,
      }]);
      
      toast.success('Tip sent successfully! Thank you for your support. 💙', { id: tipToast });
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

  return (
    <article className="bg-card border border-border rounded-2xl p-4 sm:p-5 md:p-6 transition-all hover:shadow-md">
      {/* ... your existing JSX for the card layout is perfect and remains unchanged ... */}
      {/* Example of the Tip button, which now calls the new handleTip function */}
      <div className="flex items-center gap-3 sm:gap-4 text-muted-foreground">
        <button
          onClick={handleLove}
          className="flex items-center gap-1.5 sm:gap-2 transition-colors hover:text-primary group"
          aria-label="Love story"
        >
          <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-all ${story.loved ? 'fill-primary text-primary' : 'group-hover:scale-110'}`} />
          <span className="text-xs sm:text-sm">{story.loves}</span>
        </button>

        <button
          onClick={handleTip}
          className="flex items-center gap-1.5 sm:gap-2 transition-colors hover:text-primary group"
          aria-label="Tip author"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
          <span className="text-xs sm:text-sm">Tip USDC</span>
        </button>
        {/* ... rest of the buttons ... */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm">{story.views}</span>
        </div>
      </div>
    </article>
  );
};
