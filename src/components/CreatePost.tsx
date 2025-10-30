// src/components/CreatePost.tsx

import { useState } from 'react';
import { useWallet } from './WalletProvider'; // Your context provider
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDC_ABI } from '../config';
import { encodeFunctionData, type Address } from 'viem';

interface CreatePostProps {
  onClose: () => void;
  refetchStories: () => Promise<void>;
}

export const CreatePost = ({ onClose, refetchStories }: CreatePostProps) => {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { isConnected, sendCalls, provider, subAccountAddress, universalAddress } = useWallet();

  const handlePost = async () => {
    if (!isConnected || !content.trim()) {
      toast.error('Please connect your wallet and write a story');
      return;
    }

    if (!provider || !subAccountAddress || !universalAddress) {
      toast.error('Wallet not ready');
      return;
    }

    setIsPosting(true);
    try {
      // Check Sub Account's USDC balance (posting requires 0.01 USDC minimum)
      const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;
      const REQUIRED_BALANCE = 10_000n; // 0.01 USDC (6 decimals)
      
      const balanceData = encodeFunctionData({
        abi: USDC_ABI as any,
        functionName: 'balanceOf',
        args: [subAccountAddress],
      });
      
      const balanceHex = await provider.request({
        method: 'eth_call',
        params: [{ to: USDC_ADDRESS, data: balanceData }, 'latest'],
      }) as string;
      
      const subBalance = BigInt(balanceHex);
      console.log('[CreatePost] Sub Account USDC balance:', (Number(subBalance) / 1_000_000).toFixed(2));

      // If Sub Account has insufficient USDC, request transfer from Universal Account
      if (subBalance < REQUIRED_BALANCE) {
        console.log('[CreatePost] Sub Account needs USDC. Requesting transfer from Universal Account...');
        
        // Check Universal Account balance
        const universalBalanceData = encodeFunctionData({
          abi: USDC_ABI as any,
          functionName: 'balanceOf',
          args: [universalAddress],
        });
        
        const universalBalanceHex = await provider.request({
          method: 'eth_call',
          params: [{ to: USDC_ADDRESS, data: universalBalanceData }, 'latest'],
        }) as string;
        
        const universalBalance = BigInt(universalBalanceHex);
        console.log('[CreatePost] Universal Account USDC balance:', (Number(universalBalance) / 1_000_000).toFixed(2));
        
        if (universalBalance < REQUIRED_BALANCE) {
          toast.error('Insufficient balance. Please add funds to your Base Account.', {
            description: 'You need at least 0.01 USDC to post a story.',
          });
          return;
        }

        // Transfer USDC from Universal to Sub Account via Spend Permissions
        toast.info('Requesting USDC transfer...', {
          description: 'Approving spend permission for your app account',
        });
        
        const transferData = encodeFunctionData({
          abi: USDC_ABI as any,
          functionName: 'transfer',
          args: [subAccountAddress, REQUIRED_BALANCE],
        });
        
        // Send from Universal Account (not Sub Account) by explicitly setting 'from'
        await sendCalls([{
          to: USDC_ADDRESS,
          data: transferData,
          value: '0x0',
        }]);
        
        toast.success('USDC transferred to app account');
      }

      // Now post the story
      const calldata = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: 'postStory',
        args: [content], // contentURI parameter
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
