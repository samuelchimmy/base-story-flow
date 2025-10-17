import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { useWallet } from './WalletProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';

interface CreateAMAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateAMAModal = ({ open, onOpenChange }: CreateAMAModalProps) => {
  const { universalAddress, isConnected } = useWallet();
  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  const [requiresTip, setRequiresTip] = useState(false);
  const [tipAmount, setTipAmount] = useState('0.1');
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createdAmaId, setCreatedAmaId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !universalAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!heading.trim()) {
      toast.error('Please enter a heading');
      return;
    }

    setIsCreating(true);

    try {
      const { data, error } = await supabase
        .from('amas')
        .insert({
          creator_address: universalAddress,
          heading: heading.trim(),
          description: description.trim() || null,
          requires_tip: requiresTip,
          tip_amount: requiresTip ? parseFloat(tipAmount) : 0,
          is_public: isPublic,
        })
        .select()
        .single();

      if (error) throw error;

      setCreatedAmaId(data.id);
      toast.success('AMA created successfully!');
      
      // Reset form
      setHeading('');
      setDescription('');
      setRequiresTip(false);
      setTipAmount('0.1');
      setIsPublic(true);
    } catch (error) {
      console.error('Error creating AMA:', error);
      toast.error('Failed to create AMA');
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