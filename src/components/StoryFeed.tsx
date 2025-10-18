import { useState, useEffect, useCallback } from 'react';
import { StoryCard, type Story } from './StoryCard';
import { Button } from './ui/button';
import { publicClient } from '../viemClient';
import { CONTRACT_ADDRESS, CONTRACT_ABI, AMA_CONTRACT_ADDRESS, AMA_CONTRACT_ABI } from '../config';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CreatePost } from './CreatePost';
import { CreateAMAInline } from './CreateAMAInline';
import { useWallet } from './WalletProvider';
import { getAllAMAs } from '@/lib/amaHelpers';
import { useNavigate } from 'react-router-dom';

type TabType = 'latest' | 'loved' | 'post' | 'ama' | 'sessions';

interface StoryFeedProps {
  onPostClick?: () => void;
  onAMAClick?: () => void;
}

export const StoryFeed = ({ onPostClick, onAMAClick }: StoryFeedProps) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('latest');
  const [userStories, setUserStories] = useState<any[]>([]);
  const [userAMAs, setUserAMAs] = useState<any[]>([]);
  const { subAccountAddress, universalAddress } = useWallet();
  const navigate = useNavigate();

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

  // Fetch user data for sessions tab
  const fetchUserData = useCallback(async () => {
    if (!subAccountAddress) return;

    try {
      const allStories = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getAllStories',
      });

      const myStories = allStories.filter(
        (story: any) => story.author.toLowerCase() === subAccountAddress.toLowerCase() && !story.deleted
      );

      setUserStories(myStories);

      const allAMAs = await getAllAMAs();
      const myAMAs = allAMAs.filter(
        (ama) => ama.creator.toLowerCase() === subAccountAddress.toLowerCase()
      );

      setUserAMAs(myAMAs);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  }, [subAccountAddress]);

  useEffect(() => {
    fetchStories();
    
    // Poll for new stories every 10 seconds
    const interval = setInterval(fetchStories, 10000);
    return () => clearInterval(interval);
  }, [fetchStories]);

  useEffect(() => {
    if (activeTab === 'sessions' && subAccountAddress) {
      fetchUserData();
    }
  }, [activeTab, subAccountAddress, fetchUserData]);

  const sortedStories = [...stories].sort((a, b) => {
    if (activeTab === 'latest') {
      return b.timestamp.getTime() - a.timestamp.getTime();
    } else {
      return b.loves - a.loves;
    }
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'latest':
      case 'loved':
        return (
          <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto animate-fade-in">
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
        );
      case 'post':
        return (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <CreatePost 
              onClose={() => setActiveTab('latest')} 
              refetchStories={fetchStories}
            />
          </div>
        );
      case 'ama':
        return <CreateAMAInline />;
      case 'sessions':
        return (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div>
              <h3 className="text-sm font-semibold mb-3">AMA sessions</h3>
              {!subAccountAddress ? (
                <p className="text-xs text-muted-foreground">Connect wallet to view your AMAs</p>
              ) : userAMAs.length === 0 ? (
                <p className="text-xs text-muted-foreground">No AMAs created yet</p>
              ) : (
                <div className="space-y-2">
                  {userAMAs.map((ama) => (
                    <button
                      key={ama.id.toString()}
                      onClick={() => navigate(`/ama/${ama.id.toString()}`)}
                      className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                    >
                      <p className="text-sm font-medium truncate">{ama.headingURI}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Number(ama.messageCount)} messages
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Story History</h3>
              {!subAccountAddress ? (
                <p className="text-xs text-muted-foreground">Connect wallet to view your stories</p>
              ) : userStories.length === 0 ? (
                <p className="text-xs text-muted-foreground">No stories posted yet</p>
              ) : (
                <div className="space-y-2">
                  {userStories.map((story) => (
                    <div
                      key={story.id.toString()}
                      className="p-3 rounded-lg border border-border"
                    >
                      <p className="text-sm line-clamp-2">{story.contentURI}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>❤️ {Number(story.loveCount)}</span>
                        <span>
                          {new Date(Number(story.timestamp) * 1000).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center justify-center mb-4 sm:mb-6 pb-3 border-b border-border">
          <div className="flex items-center justify-center gap-0.5 sm:gap-1">
            <Button
              variant={activeTab === 'latest' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('latest')}
              className="text-xs sm:text-sm rounded-sm px-2 sm:px-3"
            >
              Latest
            </Button>
            <Button
              variant={activeTab === 'loved' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('loved')}
              className="text-xs sm:text-sm rounded-sm px-2 sm:px-3"
            >
              Most Loved
            </Button>
            <Button
              variant={activeTab === 'post' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('post')}
              className="text-xs sm:text-sm rounded-sm px-2 sm:px-3"
            >
              Post
            </Button>
            <Button
              variant={activeTab === 'ama' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('ama')}
              className="text-xs sm:text-sm rounded-sm px-2 sm:px-3"
            >
              AMA
            </Button>
            <Button
              variant={activeTab === 'sessions' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('sessions')}
              className="text-xs sm:text-sm rounded-sm px-2 sm:px-3"
            >
              Sessions
            </Button>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};
