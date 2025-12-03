// src/components/CreatePost.tsx

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
  const { isConnected, sendCalls, getCallsStatus } = useWallet();

  // Wait for transaction to be confirmed on-chain
  const waitForConfirmation = async (callsId: string, maxAttempts = 30): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        console.log(`[CreatePost] Checking tx status (attempt ${i + 1}/${maxAttempts})...`);
        const status = await getCallsStatus(callsId);
        console.log('[CreatePost] Status:', status);
        
        // Check if transaction has receipts (confirmed)
        if (status?.receipts && status.receipts.length > 0) {
          console.log('[CreatePost] ✅ Transaction confirmed!');
          return true;
        }
        
        // Check status field if available
        if (status?.status === 'CONFIRMED' || status?.status === 'confirmed') {
          console.log('[CreatePost] ✅ Transaction confirmed via status field!');
          return true;
        }
      } catch (err) {
        console.log('[CreatePost] Status check error:', err);
      }
      
      // Wait 2 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    console.log('[CreatePost] ⚠️ Max attempts reached, proceeding anyway');
    return false;
  };

  const handlePost = async () => {
    if (!isConnected || !content.trim()) {
      toast.error('Please connect your wallet and write a story');
      return;
    }

    setIsPosting(true);
    try {
      console.log('[CreatePost] Posting story...');
      
      const calldata = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: 'postStory',
        args: [content],
      });

      const callsId = await sendCalls([{
        to: CONTRACT_ADDRESS,
        data: calldata,
        value: '0x0',
      }]);
      
      console.log('[CreatePost] Story submitted! Calls ID:', callsId);

      toast.success('Story submitted!', {
        description: 'Waiting for blockchain confirmation...',
      });
      
      setContent('');
      onClose();
      
      // Wait for confirmation before refetching
      const confirmed = await waitForConfirmation(callsId);
      
      if (confirmed) {
        toast.success('Story posted successfully!');
      }
      
      // Refetch stories after confirmation (or timeout)
      await refetchStories();
      
      // Extra refetch after a delay to ensure RPC is updated
      setTimeout(() => {
        refetchStories();
      }, 3000);
      
    } catch (error: any) {
      console.error('[CreatePost] ❌ Failed to post story:', error);
      console.error('[CreatePost] Error details:', {
        message: error?.message,
        cause: error?.cause,
        stack: error?.stack,
      });
      
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
