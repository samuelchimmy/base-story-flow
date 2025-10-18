import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { useWallet } from './WalletProvider';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { parseUnits, encodeFunctionData, decodeEventLog } from 'viem';
import { AMA_CONTRACT_ADDRESS, AMA_CONTRACT_ABI } from '@/config';

export const CreateAMAInline = () => {
  const { subAccountAddress, isConnected, sendCalls, getCallsStatus } = useWallet();
  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  const [requiresTip, setRequiresTip] = useState(false);
  const [tipAmount, setTipAmount] = useState('0.1');
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createdAmaId, setCreatedAmaId] = useState<bigint | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !subAccountAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!heading.trim()) {
      toast.error('Please enter a heading');
      return;
    }

    setIsCreating(true);
    const createToast = toast.loading('Creating AMA on blockchain...');

    try {
      const headingURI = heading.trim();
      const descriptionURI = description.trim() || '';
      const tipAmountInUSDC = requiresTip ? parseUnits(tipAmount, 6) : 0n;

      const calldata = encodeFunctionData({
        abi: AMA_CONTRACT_ABI,
        functionName: 'createAMA',
        args: [headingURI, descriptionURI, requiresTip, tipAmountInUSDC, isPublic],
      });

      const callsResponse = await sendCalls([{
        to: AMA_CONTRACT_ADDRESS,
        data: calldata,
      }]);

      // Extract the ID string from the response
      const callsId = typeof callsResponse === 'string' ? callsResponse : callsResponse.id;
      
      console.log('Transaction sent, calls ID:', callsId);
      console.log('Full response:', callsResponse);
      
      toast.loading('Waiting for confirmation...', { id: createToast });
      
      // Poll for transaction confirmation
      let receipt: any = null;
      let attempts = 0;
      const maxAttempts = 90; // 3 minutes (90 * 2 seconds)
      const pollInterval = 2000; // 2 seconds
      
      while (attempts < maxAttempts) {
        attempts++;
        
        try {
          const calls = await getCallsStatus(callsId);
          console.log(`[Attempt ${attempts}/${maxAttempts}] Status: ${calls.status}`);
          
          if (calls.status === 'CONFIRMED') {
            if (calls.receipts && calls.receipts.length > 0 && calls.receipts[0]) {
              receipt = calls.receipts[0];
              console.log('✅ Transaction confirmed! Receipt:', receipt);
              break;
            } else {
              console.warn('Status is CONFIRMED but no receipt found, continuing to poll...');
            }
          }
          
          if (calls.status === 'REVERTED') {
            throw new Error('Transaction reverted on-chain');
          }
          
          if (calls.status === 'PENDING') {
            console.log('⏳ Transaction pending...');
          }
          
        } catch (statusError) {
          console.error(`Error checking status (attempt ${attempts}):`, statusError);
          
          if (attempts > maxAttempts / 2) {
            console.warn('⚠️ Still getting errors after many attempts, but continuing...');
          }
        }
        
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }

      if (!receipt) {
        console.error(`❌ Transaction confirmation timeout after ${maxAttempts * pollInterval / 1000} seconds`);
        throw new Error(
          'Transaction is taking longer than expected. It may still succeed - please check your AMA sessions in a moment.'
        );
      }

      console.log('🔍 Searching for AMACreated event in logs...');
      const amaCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const decoded = decodeEventLog({
            abi: AMA_CONTRACT_ABI,
            data: log.data,
            topics: log.topics,
          }) as { eventName: string };
          return decoded.eventName === 'AMACreated';
        } catch {
          return false;
        }
      });

      if (!amaCreatedEvent) {
        console.error('❌ AMACreated event not found in receipt logs');
        throw new Error('AMA creation event not found in transaction receipt');
      }

      const decoded = decodeEventLog({
        abi: AMA_CONTRACT_ABI,
        data: amaCreatedEvent.data,
        topics: amaCreatedEvent.topics,
      }) as { args: { amaId: bigint } };

      const amaId = decoded.args.amaId;
      console.log('✅ AMA created with ID:', amaId.toString());
      
      setCreatedAmaId(amaId);
      toast.success('AMA created successfully!', { id: createToast });
      
      // Reset form
      setHeading('');
      setDescription('');
      setRequiresTip(false);
      setTipAmount('0.1');
      setIsPublic(true);
      
    } catch (error) {
      console.error('❌ Error creating AMA:', error);
      toast.error('Failed to create AMA', { 
        id: createToast,
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = () => {
    if (createdAmaId) {
      const link = `${window.location.origin}/ama/${createdAmaId}`;
      navigator.clipboard.writeText(link);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleReset = () => {
    setCreatedAmaId(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in">
        <h2 className="text-xl font-bold mb-6">
          {createdAmaId ? 'AMA Created!' : 'Create Anonymous AMA'}
        </h2>

        {createdAmaId ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your AMA link is ready! Share it with others to receive anonymous messages.
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/ama/${createdAmaId}`}
                className="flex-1"
              />
              <Button onClick={handleCopyLink} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleReset} className="w-full">
              Create Another AMA
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heading">Heading</Label>
              <Input
                id="heading"
                placeholder="Ask me anything!"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add some context about what you'd like people to ask..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="requiresTip">Require Tip to Message</Label>
              <Switch
                id="requiresTip"
                checked={requiresTip}
                onCheckedChange={setRequiresTip}
              />
            </div>

            {requiresTip && (
              <div className="space-y-2">
                <Label htmlFor="tipAmount">Tip Amount (USDC)</Label>
                <Input
                  id="tipAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="isPublic">Make Messages Publicly Visible</Label>
              <Switch
                id="isPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create AMA'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
