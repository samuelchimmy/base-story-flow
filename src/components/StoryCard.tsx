import { useState, useEffect, useRef } from 'react';
import { Heart, Send, Share2, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { useWallet } from './WalletProvider';
import { type Address, encodeFunctionData } from 'viem'; 
import { toast } from 'sonner';
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDC_CONTRACT_ADDRESS, USDC_ABI } from '../config';
import { supabase } from '@/integrations/supabase/client';
import { ShareDialog } from './ShareDialog';
import { getStoryTipAmount, checkUSDCPrereqs, formatUsdc, decodeRevert } from '@/lib/tip';


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
  createdAt?: number; // blockchain timestamp for sharing
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
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { isConnected, sendCalls, universalAddress, subAccountAddress, provider } = useWallet();
  const cardRef = useRef<HTMLElement | null>(null);
  const VIEW_TTL_MS = 1000 * 60 * 60 * 12; // 12h unique view window
  const maxPreviewLength = 280;

  // Increment view count only when card becomes visible and not viewed recently
  useEffect(() => {
    if (hasBeenViewed) return;

    try {
      if (typeof window === 'undefined') return;

      const key = `basestory:viewed:${story.id}`;
      const lastViewed = Number(localStorage.getItem(key) || '0');
      const now = Date.now();

      // If viewed within TTL, skip increment
      if (lastViewed && now - lastViewed < VIEW_TTL_MS) {
        setHasBeenViewed(true);
        return;
      }

      const el = cardRef.current;
      if (!el) return;

      const observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        (async () => {
          try {
            const storyCreatedAt = Math.floor(story.timestamp.getTime() / 1000);
            const { data, error } = await supabase.functions.invoke('increment-view', {
              body: { 
                storyId: parseInt(story.id), 
                contractAddress: CONTRACT_ADDRESS,
                storyCreatedAt,
              },
            });
            if (error) {
              console.error('Error incrementing view:', error);
              return;
            }
            if (data?.viewCount !== undefined) {
              setViewCount(data.viewCount);
            }
            localStorage.setItem(key, String(Date.now()));
            setHasBeenViewed(true);
          } catch (err) {
            console.error('Failed to increment view:', err);
          } finally {
            observer.disconnect();
          }
        })();
      }, { threshold: 0.5 });

      observer.observe(el);
      return () => observer.disconnect();
    } catch (err) {
      console.error('View tracking init failed:', err);
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
    setShareDialogOpen(true);
  };

  const getShareContent = () => {
    const createdAtParam = story.createdAt || Math.floor(story.timestamp.getTime() / 1000);
    const url = `https://basestory.app/?story=${story.id}&contract=${CONTRACT_ADDRESS}&createdAt=${createdAtParam}`;
    
    // Truncate story content for share text
    const truncatedContent = story.content.length > 100 
      ? story.content.slice(0, 100) + '...' 
      : story.content;
    
    const text = `"${truncatedContent}"\n\nRead this anonymous story on BaseStory 📖\n`;
    
    return { url, text };
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

  // Tip with preflight checks to avoid AA simulation reverts
  const handleTip = async () => {
    if (!isConnected || isProcessing) {
      if (!isConnected) toast.error('Please connect your wallet first');
      return;
    }

    const owner = subAccountAddress as Address | null;
    if (!owner || !provider) {
      toast.error('Wallet not ready');
      return;
    }

    setIsProcessing(true);
    const tipToast = toast.loading('Preparing your tip...');

    try {
      // 1) Read tip amount from contract (fallback to 0.1 USDC)
      const tipAmount = await getStoryTipAmount(provider);

      // 2) Balance/allowance preflight
      const { hasBalance, hasAllowance, balance } = await checkUSDCPrereqs(provider, owner, CONTRACT_ADDRESS as Address, tipAmount);
      // Don't block on low balance — Base Account Spend Permissions can fund the Sub Account automatically
      if (!hasBalance) {
        toast.message(`We'll request spend permission for ${formatUsdc(tipAmount)} USDC (you have ${formatUsdc(balance)}).`, { id: tipToast });
      }

      // 3) Build calls (conditional approve)
      const calls: { to: Address; data: `0x${string}` }[] = [];
      if (!hasAllowance) {
        const approveCalldata = encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'approve',
          args: [CONTRACT_ADDRESS, tipAmount],
        });
        calls.push({ to: USDC_CONTRACT_ADDRESS as Address, data: approveCalldata });
      }

      const tipCalldata = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: 'tipStory',
        args: [BigInt(story.id)],
      });
      calls.push({ to: CONTRACT_ADDRESS as Address, data: tipCalldata });

      toast.loading('Sending tip...', { id: tipToast });
      await sendCalls(calls);

      toast.success('Tip sent successfully! Thank you. 💙', { id: tipToast });
      await refetchStories();
    } catch (error) {
      console.error('Failed to send tip:', error);
      toast.error(decodeRevert(error), { id: tipToast });
    } finally {
      setIsProcessing(false);
    }
  };

  // If story is marked as deleted, don't render it
  if (story.deleted) {
    return null;
  }

  return (
    <article ref={cardRef} className="bg-card border border-border rounded-2xl p-4 sm:p-5 md:p-6 transition-all hover:shadow-md">
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
          <span className="text-xs sm:text-sm">{viewCount}</span>
        </div>
      </div>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        title="Share Story"
        {...getShareContent()}
      />
    </article>
  );
};
