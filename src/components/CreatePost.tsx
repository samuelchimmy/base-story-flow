import { useState } from 'react';
import { useWallet } from './WalletProvider';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';

// TODO: Replace with your deployed contract address and ABI
const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

interface CreatePostProps {
  onClose: () => void;
}

export const CreatePost = ({ onClose }: CreatePostProps) => {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { isConnected, subAccountAddress, sendCalls } = useWallet();

  const handlePost = async () => {
    if (!isConnected || !content.trim()) {
      toast.error('Please connect your wallet and write a story');
      return;
    }

    if (!subAccountAddress) {
      toast.error('Sub Account not available');
      return;
    }

    // Check if contract is deployed
    if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      toast.error('Smart contract not deployed yet', {
        description: 'The BaseStory contract needs to be deployed to Base Sepolia first',
      });
      return;
    }

    setIsPosting(true);
    try {
      // For now, just simulate posting without actual contract call
      // Once contract is deployed, use encodeFunctionData from viem
      
      toast.info('Story posting feature coming soon!', {
        description: 'Smart contract deployment required. Your story: ' + content.slice(0, 50) + '...',
      });

      // Uncomment when contract is ready:
      /*
      const { encodeFunctionData } = await import('viem');
      const calldata = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: 'postStory',
        args: [content],
      });

      await sendCalls([{
        to: CONTRACT_ADDRESS,
        data: calldata,
      }]);

      toast.success('Story posted successfully!', {
        description: 'It will appear in the feed shortly',
      });
      */
      
      setContent('');
      onClose();
    } catch (error) {
      console.error('Failed to post story:', error);
      toast.error('Failed to post story', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Share Your Story</CardTitle>
        <CardDescription>Post anonymously to the BaseStory feed</CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-3">Please connect your wallet to post a story</p>
            <Button onClick={onClose} variant="outline" size="sm">
              Close
            </Button>
          </div>
        ) : (
          <>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your story, alpha, or thoughts anonymously..."
              rows={4}
              className="mb-3"
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {content.length}/1000 characters
              </span>
              <div className="flex gap-2">
                <Button onClick={onClose} variant="outline" size="sm">
                  Cancel
                </Button>
                <Button
                  onClick={handlePost}
                  disabled={isPosting || !content.trim()}
                  size="sm"
                >
                  {isPosting ? 'Posting...' : 'Post Story'}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
