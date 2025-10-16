import { useState } from 'react';
import { useWallet } from './WalletProvider';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';
import { encodeFunctionData } from 'viem';

interface CreatePostProps {
  onClose: () => void;
  refetchStories: () => Promise<void>;
}

export const CreatePost = ({ onClose, refetchStories }: CreatePostProps) => {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { isConnected, sendCalls } = useWallet();

  const handlePost = async () => {
    if (!isConnected || !content.trim()) {
      toast.error('Please connect your wallet and write a story');
      return;
    }

    setIsPosting(true);
    try {
      const calldata = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: 'postStory',
        args: [content],
      });

      await sendCalls([{
        to: CONTRACT_ADDRESS,
        data: calldata,
        value: '0x0',
      }]);

      toast.success('Story posted successfully!', {
        description: 'It will appear in the feed shortly',
      });
      
      setContent('');
      onClose();
      
      // Refresh stories after a short delay to allow blockchain to update
      setTimeout(() => {
        refetchStories();
      }, 2000);
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
