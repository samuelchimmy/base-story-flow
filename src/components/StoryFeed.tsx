import { useState, useEffect, useCallback } from 'react';
import { StoryCard, type Story } from './StoryCard';
import { Button } from './ui/button';
import { publicClient } from '../viemClient';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SessionsDrawer } from './SessionsDrawer';

type SortType = 'latest' | 'loved';

interface StoryFeedProps {
  onPostClick: () => void;
  onAMAClick: () => void;
}

export const StoryFeed = ({ onPostClick, onAMAClick }: StoryFeedProps) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortType>('latest');

  // Fetch stories from blockchain
  const fetchStories = useCallback(async () => {
    // Only set the main loading state to true if there are no stories on screen yet.
    // This prevents the flicker on subsequent background refreshes.
    if (stories.length === 0) {
      setIsLoading(true);
    }
    
    try {
      const data = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getAllStories',
      });
      
      // Filter out any stories marked as deleted by the new contract
      const activeStories = data.filter(story => !story.deleted);

      // Fetch view counts from Supabase
      const { data: viewData } = await supabase
        .from('story_views')
        .select('story_id, view_count');

      // Create a map of story_id to view_count
      const viewCountMap = new Map(
        (viewData || []).map(item => [item.story_id.toString(), item.view_count])
      );

      // Transform contract data to Story format
      const transformedStories: Story[] = activeStories.map((story) => ({
        id: story.id.toString(),
        content: story.contentURI, // Use contentURI from new contract
        author: `${story.author.slice(0, 6)}...${story.author.slice(-4)}`,
        authorAddress: story.author,
        timestamp: new Date(Number(story.timestamp) * 1000),
        loves: Number(story.loveCount),
        views: viewCountMap.get(story.id.toString()) || 0, // Get real view count from database
        loved: false, // TODO: Check if current user has loved
        deleted: story.deleted,
      }));
      
      setStories(transformedStories);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
      toast.error('Failed to load stories from blockchain');
    } finally {
      // Always set loading to false after a fetch, to remove the initial spinner
      setIsLoading(false);
    }
  }, [stories.length]);

  useEffect(() => {
    fetchStories();
    
    // Poll for new stories every 10 seconds
    const interval = setInterval(fetchStories, 10000);
    return () => clearInterval(interval);
  }, [fetchStories]);

  const sortedStories = [...stories].sort((a, b) => {
    if (sortBy === 'latest') {
      return b.timestamp.getTime() - a.timestamp.getTime();
    } else {
      return b.loves - a.loves;
    }
  });

  return (
    <div className="w-full">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center justify-center mb-4 sm:mb-6 pb-3 border-b border-border">
          <div className="flex items-center justify-center gap-0.5 sm:gap-1">
            <Button
              variant={sortBy === 'latest' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('latest')}
              className="text-xs sm:text-sm rounded-sm px-2 sm:px-3"
            >
              Latest
            </Button>
            <Button
              variant={sortBy === 'loved' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('loved')}
              className="text-xs sm:text-sm rounded-sm px-2 sm:px-3"
            >
              Most Loved
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onPostClick}
              className="text-xs sm:text-sm rounded-sm px-2 sm:px-3"
            >
              Post
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAMAClick}
              className="text-xs sm:text-sm rounded-sm px-2 sm:px-3"
            >
              AMA
            </Button>
            <SessionsDrawer />
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading stories from blockchain...</p>
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No stories found. Be the first to post!</p>
            </div>
          ) : (
            sortedStories.map(story => (
              <StoryCard
                key={story.id}
                story={story}
                refetchStories={fetchStories}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
