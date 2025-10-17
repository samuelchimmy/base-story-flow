import { useState } from 'react';
import { Heart, Send, Share2, Eye, Download } from 'lucide-react';
import { Button } from './ui/button';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface AMAMessage {
  id: number;
  content: string;
  sender_sub_account: string;
  love_count: number;
  tip_count: number;
  created_at: string;
}

interface AMAMessageCardProps {
  message: AMAMessage;
}

export const AMAMessageCard = ({ message }: AMAMessageCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const handleSaveAsImage = async () => {
    const cardElement = document.getElementById(`ama-message-${message.id}`);
    if (!cardElement) {
      toast.error('Failed to find message card');
      return;
    }

    try {
      toast.loading('Generating image...');
      
      // Capture the card element
      const canvas = await html2canvas(cardElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });

      // Create a new canvas with brand text
      const finalCanvas = document.createElement('canvas');
      const ctx = finalCanvas.getContext('2d');
      if (!ctx) {
        toast.error('Failed to create canvas');
        return;
      }

      // Set canvas size with padding for brand
      const padding = 40;
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height + padding;

      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Draw the captured card
      ctx.drawImage(canvas, 0, 0);

      // Add BaseStory brand text at bottom right
      ctx.font = 'bold 24px Bangers, cursive';
      ctx.fillStyle = '#0052FF'; // Blue color for "Base"
      ctx.textAlign = 'right';
      ctx.fillText('Base', finalCanvas.width - 20, finalCanvas.height - 10);
      
      // Measure "Base" to position "Story"
      const baseWidth = ctx.measureText('Base').width;
      ctx.fillStyle = '#000000'; // Black color for "Story"
      ctx.fillText('Story', finalCanvas.width - baseWidth - 25, finalCanvas.height - 10);

      // Convert to blob and download
      finalCanvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to create image');
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
        
        toast.success('Image saved successfully!');
      }, 'image/png');
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error('Failed to save image');
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
          className="flex items-center gap-1.5 sm:gap-2 transition-colors hover:text-primary group"
          aria-label="Love message"
        >
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-all" />
          <span className="text-xs sm:text-sm">{message.love_count}</span>
        </button>

        <button
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