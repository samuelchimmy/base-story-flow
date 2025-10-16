import { useState, useEffect } from 'react';
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
  views: number;
  loved: boolean;
}

interface StoryCardProps {
  story: Story;
  refetchStories: () => Promise<void>;
}

// --- FINAL DIAGNOSTIC STEP ---
// This log will run for every card rendered and will tell us exactly what Vite is seeing.
console.log(
  "[StoryCard DEBUG] Reading environment variable 'VITE_SUPABASE_INCREMENT_VIEW_URL':", 
  import.meta.env.VITE_SUPABASE_INCREMENT_VIEW_URL
);

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

  useEffect(() => {
    const viewCountUrl = import.meta.env.VITE_SUPABASE_INCREMENT_VIEW_URL;

    // Log the status of the check
    console.log(`[StoryCard DEBUG #${story.id}] Checking if view can be incremented. URL exists: ${!!viewCountUrl}, Already viewed: ${hasBeenViewed}`);

    if (viewCountUrl && !hasBeenViewed) {
      console.log(`[StoryCard DEBUG #${story.id}] Condition MET. Firing increment request.`);
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
    } else {
      console.log(`[StoryCard DEBUG #${story.id}] Condition NOT MET. Skipping increment request.`);
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

  const handleLove = async () => { /* ... same as before ... */ };

  const handleTip = async () => { /* ... same as before ... */ };

  return (
    <article className="bg-card border border-border rounded-2xl p-4 sm:p-5 md:p-6 transition-all hover:shadow-md">
      {/* ... your JSX remains identical ... */}
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
          <span className="text-xs sm:text-sm">{story.views}</span>
        </div>
      </div>
    </article>
  );
};
