import { useState, useEffect, useCallback } from 'react';
import { StoryCard, type Story } from './StoryCard';
import { Button } from './ui/button';
import { publicClient } from '../viemClient';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';
import { toast } from 'sonner';
// --- FIX #1: Import the Supabase client ---
import { createClient } from '@supabase/supabase-js';

// --- FIX #2: Initialize the Supabase client for frontend queries ---
// Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are in your .env file
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type SortType = 'latest' | 'loved';

interface StoryFeedProps {
  onPostClick: () => void;
}

export const StoryFeed = ({ onPostClick }: StoryFeedProps) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortType>('latest');

  // Fetch stories from blockchain and view counts from Supabase
  const fetchStories = useCallback(async () => {
    // We only want the loading spinner on the very first load
    if (!stories.length) {
      setIsLoading(true);
    }
    
    try {
      // --- FIX #3: Fetch both on-chain and off-chain data in parallel ---
      const [onChainData, { data: viewCountsData, error: viewsError }] = await Promise.all([
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'getAllStories',
        }),
        supabase.from('story_views').select('story_id, view_count')
      ]);
      
      if (viewsError) throw viewsError;
      
      // --- FIX #4: Merge the two data sources ---
      const transformedStories: Story[] = onChainData.map((story) => {
        // Find the matching view count from the Supabase data
        const views = viewCountsData?.find(v => v.story_id === Number(story.id));
        
        return {
          id: story.id.toString(),
          content: story.content,
          author: `${story.author.slice(0, 6)}...${story.author.slice(-4)}`,
          authorAddress: story.author,
          timestamp: new Date(Number(story.timestamp) * 1000),
          loves: Number(story.loveCount),
          views: views ? views.view_count : 0, // Use real view count, default to 0
          loved: false, // TODO: Check if current user has loved
        };
      });
      
      setStories(transformedStories);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
      toast.error('Failed to load stories from the network');
    } finally {
      setIsLoading(false);
    }
  }, [stories.length]); // Depend on stories.length to manage initial loading state

  useEffect(() => {
    fetchStories();
    
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
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 border-b border-border">
          <Button
            variant={sortBy === 'latest' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('latest')}
            className="text-xs sm:text-sm"
          >
            Latest
          </Button>
          <Button
            variant={sortBy === 'loved' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('loved')}
            className="text-xs sm:text-sm"
          >
            Most Loved
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onPostClick}
            className="text-xs sm:text-sm"
          >
            Post
          </Button>
        </div>

        <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading stories from the network...</p>
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
