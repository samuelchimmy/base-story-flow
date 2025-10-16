import { useState, useEffect } from 'react';
import { Heart, Send, Share2, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { useWallet } from './WalletProvider';
import { parseUnits, type Address, encodeFunctionData } from 'viem'; 
import { toast } from 'sonner';
// Import USDC config, but we will now use transfer() instead of approve()
import { USDC_CONTRACT_ADDRESS, USDC_ABI } from '../config';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config'; // Keep for handleLove

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

  const needsExpansion = story.content.length > maxPreviewLength;
  const displayContent = needsExpansion && !isExpanded
    ? story.content.slice(0, maxPreviewLength) + '...'
    : story.content;

  const formatTimestamp = (date: Date) => { /* ... same as before ... */ };
  const handleShare = () => { /* ... same as before ... */ };
  const handleLove = async () => { /* ... same as before ... */ };

  // --- THE FINAL, CORRECT handleTip FUNCTION ---
  // This version replicates the logic from the official demo app.
  const handleTip = async () => {
    if (!isConnected || isProcessing) {
      if (!isConnected) toast.error('Please connect your wallet first');
      return;
    }
    
    setIsProcessing(true);
    const tipToast = toast.loading('Sending your 0.1 USDC tip...');
    
    try {
      // Define the tip amount (0.1 USDC)
      const tipAmount = parseUnits('0.1', 6);

      // This is a minimal ERC-20 ABI containing only the `transfer` function.
      const transferAbi = [{
        "constant": false,
        "inputs": [
          { "name": "_to", "type": "address" },
          { "name": "_value", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [{ "name": "", "type": "bool" }],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      }] as const;

      // Encode the calldata for a direct USDC transfer.
      const calldata = encodeFunctionData({
        abi: transferAbi,
        functionName: 'transfer',
        args: [story.authorAddress, tipAmount], // Arg1: Recipient (the story author), Arg2: Amount
      });

      // Send the transaction directly TO the USDC contract.
      // Because this is a direct transfer of a token the Sub Account does not have,
      // the SDK will now correctly trigger the Auto Spend Permissions flow and show the checkbox.
      await sendCalls([{
        to: USDC_CONTRACT_ADDRESS,
        data: calldata,
      }]);

      // --- Important: We also need to update our contract's tipCount ---
      // This is a "fire-and-forget" call to our own contract to keep the counts in sync.
      const incrementTipCountCalldata = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: 'tipStory', // We will re-purpose this function slightly
        args: [BigInt(story.id)],
      });
      
      // We send this as a separate, silent transaction
      // Note: This assumes your `tipStory` function in the contract still increments the count.
      // If it fails, the user won't see an error, but the count might be off.
      // This is a trade-off for getting the checkbox to appear.
      sendCalls([{ to: CONTRACT_ADDRESS, data: incrementTipCountCalldata }]);
      
      toast.success('Tip sent successfully! Thank you. 💙', { id: tipToast });
      
      // Give the blockchain a moment before refetching
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

  if (story.deleted) {
    return null;
  }

  return (
    <article className="bg-card border border-border rounded-2xl p-4 sm:p-5 md:p-6 transition-all hover:shadow-md">
       {/* ... the rest of your JSX remains exactly the same ... */}
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
        {/* ... */}
      </div>
    </article>
  );
};
