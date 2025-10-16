import { useState, useEffect, useCallback } from 'react';
import { StoryCard, type Story } from './StoryCard';
import { Button } from './ui/button';
import { publicClient } from '../viemClient';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';
import { toast } from 'sonner';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- HARDENED INITIALIZATION ---
// Get the environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a variable to hold the client, which might be null
let supabase: SupabaseClient | null = null;

// Only initialize the client if BOTH variables are present
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Log a warning in the console so the developer knows what's wrong
  console.warn("environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are not configured. View counts will be disabled.");
}

type SortType = 'latest' | 'loved';

interface StoryFeedProps {
  onPostClick: () => void;
}

export const StoryFeed = ({ onPostClick }: StoryFeedProps) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortType>('latest');

  const fetchStories = useCallback(async () => {
    if (!stories.length) setIsLoading(true);
    
    try {
      // 1. Fetch core story data from the smart contract (this is always required)
      const onChainData = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getAllStories',
      });

      let viewCountsData: any[] = []; // Default to an empty array

      // 2. Only fetch from Supabase if the client was successfully initialized
      if (supabase) {
        const { data, error } = await supabase
          .from('story_views')
          .select('story_id, view_count');
        
        if (error) {
          // Throw the error to be caught below, preventing data merging with faulty data
          throw new Error(`Supabase error: ${error.message}`);
        }
        viewCountsData = data || [];
      } else {
        // If Supabase is not configured, we don't fetch, and view counts will default to 0
      }
      
      // 3. Merge the two data sources
      const transformedStories: Story[] = onChainData.map((story) => {
        const views = viewCountsData.find(v => v.story_id === Number(story.id));
        
        return {
          id: story.id.toString(),
          content: story.content,
          author: `${story.author.slice(0, 6)}...${story.author.slice(-4)}`,
          authorAddress: story.author,
          timestamp: new Date(Number(story.timestamp) * 1000),
          loves: Number(story.loveCount),
          views: views ? views.view_count : 0,
          loved: false,
        };
      });
      
      setStories(transformedStories);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
      toast.error('Failed to load stories from the network', {
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [stories.length]);

  useEffect(() => {
    // Show a one-time warning toast if Supabase is not configured
    if (!supabase) {
      toast.warning("View count feature is disabled.", {
        description: "environment variables are not set.",
      });
    }
    
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
        {/* ... your existing JSX for buttons ... */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 border-b border-border">
          <Button variant={sortBy === 'latest' ? 'default' : 'ghost'} size="sm" onClick={() => setSortBy('latest')} className="text-xs sm:text-sm">Latest</Button>
          <Button variant={sortBy === 'loved' ? 'default' : 'ghost'} size="sm" onClick={() => setSortBy('loved')} className="text-xs sm:text-sm">Most Loved</Button>
          <Button variant="ghost" size="sm" onClick={onPostClick} className="text-xs sm:text-sm">Post</Button>
        </div>
        
        <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground"><p>Loading stories from the network...</p></div>
          ) : stories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><p>No stories found. Be the first to post!</p></div>
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
