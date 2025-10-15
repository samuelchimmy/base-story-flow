import { useState } from 'react';
import { StoryCard, type Story } from './StoryCard';
import { Button } from './ui/button';
import { useWallet } from './WalletProvider';
import { type Address } from 'viem';
import { toast } from 'sonner';

type SortType = 'latest' | 'loved';

// Mock data for demonstration
const generateMockStories = (): Story[] => {
  const stories: Story[] = [
    {
      id: '1',
      content: 'Just discovered an amazing alpha on Base. The ecosystem is growing so fast, builders are shipping every day. The future of onchain apps is here and it\'s beautiful.',
      author: 'Anonymous Sage 4732',
      authorAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as Address,
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      loves: 42,
      views: 156,
      loved: false,
    },
    {
      id: '2',
      content: 'The best investment I ever made was learning to build. Smart contracts, frontend, design - it all compounds. Start today.',
      author: 'Crypto Writer 8291',
      authorAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as Address,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      loves: 89,
      views: 234,
      loved: false,
    },
    {
      id: '3',
      content: 'Anonymous posting on-chain is the future. No reputation games, no follower counts. Just pure ideas and alpha. This is what crypto was meant to be.',
      author: 'Shadow Narrator 1337',
      authorAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as Address,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      loves: 156,
      views: 478,
      loved: false,
    },
    {
      id: '4',
      content: 'GM to all the builders out there. Keep building, keep shipping. The bear market is for building.',
      author: 'Mystery Author 9999',
      authorAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as Address,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      loves: 67,
      views: 189,
      loved: false,
    },
  ];
  return stories;
};

export const StoryFeed = () => {
  const [stories, setStories] = useState<Story[]>(generateMockStories());
  const [sortBy, setSortBy] = useState<SortType>('latest');
  const { sendCalls, isConnected } = useWallet();

  const sortedStories = [...stories].sort((a, b) => {
    if (sortBy === 'latest') {
      return b.timestamp.getTime() - a.timestamp.getTime();
    } else {
      return b.loves - a.loves;
    }
  });

  const handleLove = async (id: string) => {
    try {
      // Optimistic update
      setStories(prev =>
        prev.map(story =>
          story.id === id
            ? {
                ...story,
                loved: !story.loved,
                loves: story.loved ? story.loves - 1 : story.loves + 1,
              }
            : story
        )
      );

      // On-chain transaction using Sub Account with Auto Spend Permissions
      // First love will prompt for approval, subsequent loves will be frictionless
      toast.success('Story loved! ❤️');
      
      // In production, this would call your smart contract
      // const contractAddress = '0x...' as Address;
      // await sendCalls([{
      //   to: contractAddress,
      //   data: encodeLoveData(id),
      //   value: '0x0',
      // }]);
    } catch (error) {
      console.error('Failed to love story:', error);
      toast.error('Failed to love story');
      
      // Revert optimistic update
      setStories(prev =>
        prev.map(story =>
          story.id === id
            ? {
                ...story,
                loved: !story.loved,
                loves: story.loved ? story.loves + 1 : story.loves - 1,
              }
            : story
        )
      );
    }
  };

  const handleTip = async (id: string, authorAddress: Address) => {
    try {
      toast.loading('Processing tip...');
      
      // Send 0.001 ETH tip using Sub Account with Auto Spend Permissions
      // First tip will prompt for approval, subsequent tips will be frictionless
      await sendCalls([{
        to: authorAddress,
        value: '0x38D7EA4C68000', // 0.001 ETH in hex
      }]);
      
      toast.success('Tip sent! 💙');
    } catch (error) {
      console.error('Failed to send tip:', error);
      toast.error('Failed to send tip');
    }
  };

  return (
    <div className="w-full">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 border-b border-border">
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
        </div>

        <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto">
          {sortedStories.map(story => (
            <StoryCard
              key={story.id}
              story={story}
              onLove={handleLove}
              onTip={handleTip}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
