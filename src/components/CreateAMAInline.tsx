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
// import removed: publicClient not needed; using provider.getCallsStatus via WalletProvider

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

      const callsId = await sendCalls([{
        to: AMA_CONTRACT_ADDRESS,
        data: calldata,
      }]);

      // Wait for transaction and get AMA ID from event
      toast.loading('Waiting for confirmation...', { id: createToast });
      
      // Poll for transaction receipt
      let receipt;
      let attempts = 0;
      while (attempts < 30) {
        try {
          const calls = await getCallsStatus(callsId);
          if (calls.status === 'CONFIRMED' && calls.receipts?.[0]) {
            receipt = calls.receipts[0];
            break;
          }
        } catch (e) {
          // Continue polling
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }

      if (!receipt) {
        throw new Error('Transaction confirmation timeout');
      }

      // Parse AMACreated event to get the AMA ID
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
        throw new Error('AMA creation event not found');
      }

      const decoded = decodeEventLog({
        abi: AMA_CONTRACT_ABI,
        data: amaCreatedEvent.data,
        topics: amaCreatedEvent.topics,
      }) as { args: { amaId: bigint } };

      const amaId = decoded.args.amaId;
      setCreatedAmaId(amaId);
      
      toast.success('AMA created successfully!', { id: createToast });
      
      // Reset form
      setHeading('');
      setDescription('');
      setRequiresTip(false);
      setTipAmount('0.1');
      setIsPublic(true);
    } catch (error) {
      console.error('Error creating AMA:', error);
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
