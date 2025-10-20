import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AMAMessageCard } from '@/components/AMAMessageCard';
import { useWallet } from '@/components/WalletProvider';
import { toast } from 'sonner';
import { parseUnits, encodeFunctionData } from 'viem';
import { USDC_CONTRACT_ADDRESS, USDC_ABI, AMA_CONTRACT_ADDRESS, AMA_CONTRACT_ABI } from '@/config';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAMA, getAMAMessages, type AMA, type AMAMessage as BlockchainAMAMessage } from '@/lib/amaHelpers';

// UI-friendly AMA message type
interface UIAMAMessage {
  id: number;
  content: string;
  sender_sub_account: string;
  love_count: number;
  tip_count: number;
  created_at: string;
  blockchainId: bigint;
  amaId: bigint;
}

export default function AMA() {
  const { id } = useParams<{ id: string }>();
  const { isConnected, subAccountAddress, sendCalls, currentNetwork } = useWallet();
  const [ama, setAma] = useState<AMA | null>(null);
  const [messages, setMessages] = useState<UIAMAMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      await fetchAMA();
      await fetchMessages();
    })();
  }, [id, subAccountAddress]);

  const fetchAMA = async () => {
    try {
      const amaId = BigInt(id!);
      const amaData = await getAMA(amaId, currentNetwork);
      
      if (!amaData) {
        throw new Error('AMA not found');
      }
      
      setAma(amaData);
    } catch (error) {
      console.error('Error fetching AMA:', error);
      toast.error('Failed to load AMA');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const amaId = BigInt(id!);
      // Compute pagination from the end if we know total count
      let start = 0n;
      const limit = 100n;
      if (ama?.messageCount && ama.messageCount > 0n) {
        start = ama.messageCount > limit ? ama.messageCount - limit : 0n;
      }

      const viewer = subAccountAddress as any;
      const messagesData = await getAMAMessages(amaId, currentNetwork, start, limit, viewer);
      
      const uiMessages: UIAMAMessage[] = messagesData.map((msg, index) => ({
        id: index,
        blockchainId: msg.id,
        amaId: msg.amaId,
        content: msg.contentURI,
        sender_sub_account: msg.sender,
        love_count: Number(msg.loveCount ?? 0n),
        tip_count: 0,
        created_at: new Date(Number(msg.createdAt) * 1000).toISOString(),
      }));
      
      setMessages(uiMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      const msg = String(error);
      if (msg.includes('AMAMessagesPrivate')) {
        toast.info('Messages are private for this AMA');
      } else {
        toast.error('Failed to load messages');
      }
      setMessages([]);
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
      const amaId = BigInt(id!);
      const messageContent = newMessage.trim();

      // Encode the postMessageToAMA function call
      const postMessageCalldata = encodeFunctionData({
        abi: AMA_CONTRACT_ABI,
        functionName: 'postMessageToAMA',
        args: [amaId, messageContent],
      });

      // Build all calls in one atomic batch
      const calls = [];

      // If tip is required, approve and transfer USDC to the AMA contract
      if (ama.requiresTip) {
        const tipAmountInUSDC = ama.tipAmount;

        toast.loading('Preparing tip and message...', { id: sendToast });

        // Step 1: Approve USDC transfer to AMA contract (not creator)
        const approveCalldata = encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'approve',
          args: [AMA_CONTRACT_ADDRESS, tipAmountInUSDC],
        });

        calls.push({
          to: USDC_CONTRACT_ADDRESS,
          data: approveCalldata,
        });

        // Note: Contract will handle transferFrom internally using the allowance
      }

      toast.loading('Posting message to blockchain...', { id: sendToast });

      // Add the message posting call
      calls.push({
        to: AMA_CONTRACT_ADDRESS,
        data: postMessageCalldata,
      });

      // Send all calls atomically
      await sendCalls(calls);

      toast.success('Message sent successfully!', { id: sendToast });
      setNewMessage('');
      
      // Refresh messages after a short delay to allow blockchain to update
      setTimeout(() => fetchMessages(), 2000);
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
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{ama.headingURI}</h1>
          {ama.descriptionURI && (
            <p className="text-muted-foreground mb-4">{ama.descriptionURI}</p>
          )}
          {ama.requiresTip && (
            <p className="text-sm text-primary">
              Tip required: {Number(ama.tipAmount) / 1e6} USDC per message
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Messages: {Number(ama.messageCount)}
          </p>
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
              <AMAMessageCard key={message.id} message={message} tipAmount={ama?.tipAmount} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}