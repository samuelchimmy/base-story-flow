import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FundAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  universalAddress: string;
  currentBalance: string;
  onBalanceUpdate: () => void;
}

export const FundAccountModal = ({
  isOpen,
  onClose,
  universalAddress,
  currentBalance,
  onBalanceUpdate,
}: FundAccountModalProps) => {
  const [depositDetected, setDepositDetected] = useState(false);
  const [depositAmount, setDepositAmount] = useState('0');
  const [countdown, setCountdown] = useState(5);
  const [initialBalance, setInitialBalance] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialBalance === null) {
      // Only set initial balance once when modal first opens
      setInitialBalance(currentBalance);
      setDepositDetected(false);
      setCountdown(5);
    }
  }, [isOpen, currentBalance, initialBalance]);

  // Poll for balance changes
  useEffect(() => {
    if (!isOpen || depositDetected) return;

    const pollInterval = setInterval(() => {
      onBalanceUpdate();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [isOpen, depositDetected, onBalanceUpdate]);

  // Check for deposit
  useEffect(() => {
    if (!isOpen || depositDetected || initialBalance === null) return;

    const currentBalanceNum = parseFloat(currentBalance);
    const initialBalanceNum = parseFloat(initialBalance);
    
    // Only trigger success if there's a meaningful increase (at least 0.1 USDC)
    if (currentBalanceNum > initialBalanceNum) {
      const deposited = currentBalanceNum - initialBalanceNum;
      if (deposited >= 0.1) {
        setDepositAmount(deposited.toFixed(2));
        setDepositDetected(true);
      }
    }
  }, [currentBalance, initialBalance, isOpen, depositDetected]);

  // Countdown and auto-close
  useEffect(() => {
    if (!depositDetected) return;

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onClose();
          // Reset state when closing
          setInitialBalance(null);
          setDepositDetected(false);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [depositDetected, onClose]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(universalAddress);
      toast.success('Address copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 22)}...${address.slice(-20)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] max-w-[90vw] mx-auto rounded-2xl border-0 shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center mb-1">
            Fund Your Account
          </DialogTitle>
        </DialogHeader>

        {!depositDetected ? (
          <div className="space-y-4 py-2">
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground">Current Balance</p>
              <p className="text-xl font-bold">{currentBalance} USDC</p>
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">Your Deposit Address</p>
              <div className="relative bg-muted rounded-xl p-3 pr-10">
                <p className="text-xs font-mono break-all pr-2">
                  {formatAddress(universalAddress)}
                </p>
                <button
                  onClick={copyAddress}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-background rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Waiting for deposit...</p>
            </div>

            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5 text-xs text-center">
              <p className="font-semibold text-xs">Transactions on BaseStory are gasless</p>
              <p className="text-muted-foreground">Send USDC from any wallet for tipping</p>
              <p className="text-muted-foreground">Usually takes 10-30 seconds</p>
              <p className="text-muted-foreground">Minimum: 0.1 USDC</p>
            </div>

            <Button
              onClick={onClose}
              variant="outline"
              className="w-full h-10 rounded-full text-sm"
            >
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-6 text-center">
            <div className="flex justify-center">
              <div className="animate-scale-in">
                <CheckCircle2 className="w-16 h-16 text-green-500" strokeWidth={2} />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xl font-bold text-green-600">Deposit Received!</p>
              <p className="text-2xl font-bold">{depositAmount} USDC</p>
            </div>

            <p className="text-sm text-muted-foreground">Closing in {countdown}s...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
