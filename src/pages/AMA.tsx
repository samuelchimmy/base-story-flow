import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AMAMessageCard } from '@/components/AMAMessageCard';
import { useWallet } from '@/components/WalletProvider';
import { toast } from 'sonner';
import { parseUnits, encodeFunctionData } from 'viem';
import { USDC_CONTRACT_ADDRESS, USDC_ABI } from '@/config';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AMA {
  id: number;
  creator_address: string;
  heading: string;
  description: string | null;
  requires_tip: boolean;
  tip_amount: number;
  is_public: boolean;
  created_at: string;
}

interface AMAMessage {
  id: number;
  ama_id: number;
  sender_sub_account: string;
  content: string;
  love_count: number;
  tip_count: number;
  created_at: string;
}

export default function AMA() {
  const { id } = useParams<{ id: string }>();
  const { isConnected, subAccountAddress, sendCalls } = useWallet();
  const [ama, setAma] = useState<AMA | null>(null);
  const [messages, setMessages] = useState<AMAMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAMA();
      fetchMessages();
    }
  }, [id]);

  const fetchAMA = async () => {
    try {
      const { data, error } = await supabase
        .from('amas')
        .select('*')
        .eq('id', parseInt(id!))
        .single();

      if (error) throw error;
      setAma(data);
    } catch (error) {
      console.error('Error fetching AMA:', error);
      toast.error('Failed to load AMA');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('ama_messages')
        .select('*')
        .eq('ama_id', parseInt(id!))
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !subAccountAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!ama) return;

    setIsSending(true);
    const sendToast = toast.loading('Sending message...');

    try {
      // If tip is required, execute the direct transfer
      if (ama.requires_tip) {
        const tipAmount = parseUnits(ama.tip_amount.toString(), 6); // USDC has 6 decimals

        toast.loading('Please approve the USDC spending...', { id: sendToast });

        // Step 1: Approve USDC transfer
        const approveCalldata = encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'approve',
          args: [ama.creator_address as `0x${string}`, tipAmount],
        });

        await sendCalls([{
          to: USDC_CONTRACT_ADDRESS,
          data: approveCalldata,
        }]);

        toast.loading('Sending tip...', { id: sendToast });

        // Step 2: Direct transfer USDC to creator
        const transferCalldata = encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'transfer',
          args: [ama.creator_address as `0x${string}`, tipAmount],
        });

        await sendCalls([{
          to: USDC_CONTRACT_ADDRESS,
          data: transferCalldata,
        }]);

        toast.success('Tip sent successfully!', { id: sendToast });
      }

      toast.loading('Posting message...', { id: sendToast });

      // Insert the message
      const { error: insertError } = await supabase
        .from('ama_messages')
        .insert({
          ama_id: parseInt(id!),
          sender_sub_account: subAccountAddress,
          content: newMessage.trim(),
        });

      if (insertError) throw insertError;

      toast.success('Message sent successfully!', { id: sendToast });
      setNewMessage('');
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message', {
        id: sendToast,
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading AMA...</p>
      </div>
    );
  }

  if (!ama) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">AMA not found</p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Feed
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Feed
          </Button>
        </Link>

        {/* AMA Header */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{ama.heading}</h1>
          {ama.description && (
            <p className="text-muted-foreground mb-4">{ama.description}</p>
          )}
          {ama.requires_tip && (
            <p className="text-sm text-primary">
              Tip required: {ama.tip_amount} USDC per message
            </p>
          )}
        </div>

        {/* Send Message Form */}
        <form onSubmit={handleSendMessage} className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Send Anonymous Message</h2>
          <Textarea
            placeholder="Type your anonymous message here..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={4}
            className="mb-4"
          />
          <Button type="submit" className="w-full" disabled={isSending || !isConnected}>
            {isSending ? 'Sending...' : isConnected ? 'Send Message' : 'Connect Wallet to Send'}
          </Button>
        </form>

        {/* Messages */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Messages</h2>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages yet. Be the first to send one!</p>
            </div>
          ) : (
            messages.map((message) => (
              <AMAMessageCard key={message.id} message={message} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}