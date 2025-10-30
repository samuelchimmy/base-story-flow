import { useState } from 'react';
import { Heart, Send, Share2, Eye, Download } from 'lucide-react';
import { Button } from './ui/button';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { useWallet } from './WalletProvider';
import { encodeFunctionData, type Address } from 'viem';
import { AMA_CONTRACT_ADDRESS, AMA_CONTRACT_ABI, USDC_CONTRACT_ADDRESS, USDC_ABI } from '@/config';
import { checkUSDCPrereqs, formatUsdc, decodeRevert } from '@/lib/tip';

interface AMAMessage {
  id: number;
  content: string;
  sender_sub_account: string;
  love_count: number;
  tip_count: number;
  created_at: string;
  blockchainId?: bigint;
  amaId?: bigint;
}

interface AMAMessageCardProps {
  message: AMAMessage;
  tipAmount?: bigint;
}

export const AMAMessageCard = ({ message, tipAmount }: AMAMessageCardProps) => {
  const { isConnected, sendCalls, universalAddress, subAccountAddress, provider } = useWallet();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoved, setIsLoved] = useState(false);
  const [localLoveCount, setLocalLoveCount] = useState(message.love_count);
  const maxPreviewLength = 280;

  const needsExpansion = message.content.length > maxPreviewLength;
  const displayContent = needsExpansion && !isExpanded
    ? message.content.slice(0, maxPreviewLength) + '...'
    : message.content;

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m ago`;
  };

  const handleLove = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!message.blockchainId || !message.amaId) {
      toast.error('Blockchain data not available');
      return;
    }

    if (isLoved) {
      toast.info('You already loved this message');
      return;
    }

    try {
      const calldata = encodeFunctionData({
        abi: AMA_CONTRACT_ABI,
        functionName: 'loveAMAMessage',
        args: [message.amaId, message.blockchainId],
      });

      await sendCalls([{
        to: AMA_CONTRACT_ADDRESS,
        data: calldata,
      }]);

      setIsLoved(true);
      setLocalLoveCount(prev => prev + 1);
      toast.success('Message loved!');
    } catch (error) {
      console.error('Error loving message:', error);
      toast.error('Failed to love message');
    }
  };

  const handleTip = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!message.blockchainId || !message.amaId) {
      toast.error('Blockchain data not available');
      return;
    }

    const owner = (universalAddress || subAccountAddress) as Address | null;
    if (!owner || !provider) {
      toast.error('Wallet not ready');
      return;
    }

    const tipToast = toast.loading('Preparing tip...');
    try {
      const calls: { to: `0x${string}`; data: `0x${string}` }[] = [];

      // If AMA requires a tip, ensure balance/allowance; otherwise only send the tip call
      if (typeof tipAmount === 'bigint' && tipAmount > 0n) {
        const { hasBalance, hasAllowance, balance } = await checkUSDCPrereqs(provider, owner, AMA_CONTRACT_ADDRESS, tipAmount);
        if (!hasBalance) {
          toast.error(`You need ${formatUsdc(tipAmount)} USDC. You have ${formatUsdc(balance)}.`, { id: tipToast });
          return;
        }
        if (!hasAllowance) {
          const approveData = encodeFunctionData({
            abi: USDC_ABI,
            functionName: 'approve',
            args: [AMA_CONTRACT_ADDRESS, tipAmount],
          });
          calls.push({ to: USDC_CONTRACT_ADDRESS, data: approveData });
        }
      }

      const tipData = encodeFunctionData({
        abi: AMA_CONTRACT_ABI,
        functionName: 'tipAMAMessage',
        args: [message.amaId, message.blockchainId],
      });
      calls.push({ to: AMA_CONTRACT_ADDRESS, data: tipData });

      await sendCalls(calls as any);
      toast.success('Tip sent successfully!', { id: tipToast });
    } catch (error) {
      console.error('Error tipping message:', error);
      toast.error(decodeRevert(error), { id: tipToast });
    }
  };

  const handleSaveAsImage = async () => {
    const cardElement = document.getElementById(`ama-message-${message.id}`);
    if (!cardElement) {
      toast.error('Failed to find message card');
      return;
    }

    let toastId: string | number | undefined;
    try {
      toastId = toast.loading('Generating image...');
      
      // Capture the card element
      const canvas = await html2canvas(cardElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });

      // Create a new canvas with brand header area
      const finalCanvas = document.createElement('canvas');
      const ctx = finalCanvas.getContext('2d');
      if (!ctx) {
        if (toastId) toast.error('Failed to create canvas', { id: toastId });
        else toast.error('Failed to create canvas');
        return;
      }

      // Header height to place brand at the top
      const headerHeight = 60;
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height + headerHeight;

      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Add BaseStory brand text at top-left
      ctx.font = 'bold 28px Bangers, cursive';
      ctx.textAlign = 'left';
      const x = 20;
      const y = 40; // within header
      ctx.fillStyle = '#0052FF'; // Blue for "Base"
      ctx.fillText('Base', x, y);
      const baseWidth = ctx.measureText('Base').width;
      ctx.fillStyle = '#000000'; // Black for "Story"
      ctx.fillText('Story', x + baseWidth + 2, y);

      // Draw the captured card below the header
      ctx.drawImage(canvas, 0, headerHeight);

      // Convert to blob and download
      finalCanvas.toBlob((blob) => {
        if (!blob) {
          if (toastId) toast.error('Failed to create image', { id: toastId });
          else toast.error('Failed to create image');
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `basestory-message-${message.id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Image saved successfully!', { id: toastId });
      }, 'image/png');
    } catch (error) {
      console.error('Error saving image:', error);
      if (toastId) toast.error('Failed to save image', { id: toastId });
      else toast.error('Failed to save image');
    }
  };

  return (
    <article 
      id={`ama-message-${message.id}`}
      className="bg-card border border-border rounded-2xl p-4 sm:p-5 md:p-6 transition-all hover:shadow-md"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <span className="text-sm sm:text-base font-medium text-muted-foreground">
            A
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm sm:text-base text-foreground">
              Anonymous
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(message.created_at)}
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

      <div className="flex items-center gap-3 sm:gap-4 text-muted-foreground flex-wrap">
        <button
          onClick={handleLove}
          className={`flex items-center gap-1.5 sm:gap-2 transition-colors group ${
            isLoved ? 'text-primary' : 'hover:text-primary'
          }`}
          aria-label="Love message"
        >
          <Heart 
            className={`w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-all ${
              isLoved ? 'fill-current' : ''
            }`} 
          />
          <span className="text-xs sm:text-sm">{localLoveCount}</span>
        </button>

        <button
          onClick={handleTip}
          className="flex items-center gap-1.5 sm:gap-2 transition-colors hover:text-primary group"
          aria-label="Tip"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
          <span className="text-xs sm:text-sm">Tip</span>
        </button>

        <button
          className="flex items-center gap-1.5 sm:gap-2 transition-colors hover:text-primary group"
          aria-label="Share"
        >
          <Share2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
          <span className="text-xs sm:text-sm">Share</span>
        </button>

        <button
          onClick={handleSaveAsImage}
          className="flex items-center gap-1.5 sm:gap-2 transition-colors hover:text-primary group"
          aria-label="Save as image"
        >
          <Download className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
          <span className="text-xs sm:text-sm">Save</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm">0</span>
        </div>
      </div>
    </article>
  );
};