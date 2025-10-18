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
  const { isConnected, subAccountAddress, sendCalls } = useWallet();
  const [ama, setAma] = useState<AMA | null>(null);
  const [messages, setMessages] = useState<UIAMAMessage[]>([]);
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
      const amaId = BigInt(id!);
      const amaData = await getAMA(amaId);
      
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
      const messagesData = await getAMAMessages(amaId, 0n, 100n);
      
      // Convert blockchain messages to UI-friendly format
      const uiMessages: UIAMAMessage[] = messagesData.map((msg, index) => ({
        id: index,
        blockchainId: msg.id,
        amaId: msg.amaId,
        content: msg.contentURI,
        sender_sub_account: msg.sender,
        love_count: Number(msg.loveCount),
        tip_count: Number(msg.tipCount),
        created_at: new Date(Number(msg.timestamp) * 1000).toISOString(),
      }));
      
      setMessages(uiMessages);
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
      const amaId = BigInt(id!);
      const messageContent = newMessage.trim();

      // Encode the postMessageToAMA function call
      const postMessageCalldata = encodeFunctionData({
        abi: AMA_CONTRACT_ABI,
        functionName: 'postMessageToAMA',
        args: [amaId, messageContent],
      });

      // If tip is required, we need to approve and send the tip first
      if (ama.requiresTip) {
        const tipAmountInUSDC = ama.tipAmount;

        toast.loading('Approving USDC spending...', { id: sendToast });

        // Step 1: Approve USDC transfer
        const approveCalldata = encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'approve',
          args: [ama.creator as `0x${string}`, tipAmountInUSDC],
        });

        await sendCalls([{
          to: USDC_CONTRACT_ADDRESS,
          data: approveCalldata,
        }]);

        toast.loading('Sending tip...', { id: sendToast });

        // Step 2: Transfer USDC to creator
        const transferCalldata = encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'transfer',
          args: [ama.creator as `0x${string}`, tipAmountInUSDC],
        });

        await sendCalls([{
          to: USDC_CONTRACT_ADDRESS,
          data: transferCalldata,
        }]);
      }

      toast.loading('Posting message to blockchain...', { id: sendToast });

      // Post the message to the blockchain
      await sendCalls([{
        to: AMA_CONTRACT_ADDRESS,
        data: postMessageCalldata,
      }]);

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
              <AMAMessageCard key={message.id} message={message} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}