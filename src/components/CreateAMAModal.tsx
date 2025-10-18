import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
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
import { publicClient } from '@/viemClient';
interface CreateAMAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateAMAModal = ({ open, onOpenChange }: CreateAMAModalProps) => {
  const { subAccountAddress, isConnected, sendCalls } = useWallet();
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
      // Store heading and description as URIs (in this case, just the content itself)
      const headingURI = heading.trim();
      const descriptionURI = description.trim() || '';
      const tipAmountInUSDC = requiresTip ? parseUnits(tipAmount, 6) : 0n;

      // Encode the createAMA function call
      const calldata = encodeFunctionData({
        abi: AMA_CONTRACT_ABI,
        functionName: 'createAMA',
        args: [headingURI, descriptionURI, requiresTip, tipAmountInUSDC, isPublic],
      });

      // Send the transaction
      const callsId = await sendCalls([
        {
          to: AMA_CONTRACT_ADDRESS,
          data: calldata,
        },
      ]);

      console.log('Transaction sent, calls ID:', callsId);
      toast.loading('Waiting for confirmation...', { id: createToast });

      let receipt: any;
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes total (60 * 2 seconds)
      
      while (attempts < maxAttempts) {
        try {
          const calls = await publicClient.getCallsStatus({ id: callsId });
          console.log(`Attempt ${attempts + 1}/${maxAttempts}, status:`, calls.status);
          
          if (calls.status === 'CONFIRMED' && calls.receipts?.[0]) {
            receipt = calls.receipts[0];
            console.log('Transaction confirmed! Receipt:', receipt);
            break;
          }
          
          if (calls.status === 'REVERTED') {
            throw new Error('Transaction reverted on-chain');
          }
        } catch (error) {
          console.error('Error checking transaction status:', error);
        }
        
        await new Promise((r) => setTimeout(r, 2000));
        attempts++;
      }

      if (!receipt) {
        console.error('Transaction confirmation timeout after', maxAttempts * 2, 'seconds');
        throw new Error('Transaction confirmation timeout. Please check your wallet or try again.');
      }

      const amaCreatedLog = receipt.logs.find((log: any) => {
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

      if (!amaCreatedLog) throw new Error('AMA creation event not found');

      const decoded = decodeEventLog({
        abi: AMA_CONTRACT_ABI,
        data: amaCreatedLog.data,
        topics: amaCreatedLog.topics,
      }) as { args: { amaId: bigint } };

      setCreatedAmaId(decoded.args.amaId);
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

  const handleClose = () => {
    setCreatedAmaId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {createdAmaId ? 'AMA Created!' : 'Create Anonymous AMA'}
          </DialogTitle>
        </DialogHeader>

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
            <Button onClick={handleClose} className="w-full">
              Done
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
      </DialogContent>
    </Dialog>
  );
};