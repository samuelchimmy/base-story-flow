import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { monitorDeposit, type DepositResult } from '@/lib/balanceMonitor';
import { formatUnits, formatEther } from 'viem';
import { getPublicClient } from '@/viemClient';
import { getContractAddress } from '@/networkConfig';
import { useWallet } from './WalletProvider';

interface FundingCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  currentBalance: string;
  onSuccess: () => void;
}

export const FundingCard = ({ 
  open, 
  onOpenChange, 
  address, 
  currentBalance,
  onSuccess 
}: FundingCardProps) => {
  const { currentNetwork } = useWallet();
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'waiting' | 'checking' | 'success'>('waiting');
  const [depositInfo, setDepositInfo] = useState<DepositResult | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!open || !address) return;

    setStatus('waiting');
    setDepositInfo(null);
    setCountdown(3);

    let cleanup: (() => void) | null = null;

    const startMonitoring = async () => {
      try {
        const client = getPublicClient(currentNetwork);
        const usdcAddress = getContractAddress(currentNetwork, 'usdc');
        
        const usdcBalance = await client.readContract({
          address: usdcAddress,
          abi: [{
            constant: true,
            inputs: [{ name: '_owner', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: 'balance', type: 'uint256' }],
            type: 'function',
          }],
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        } as any);

        const initialBalances = {
          usdc: formatUnits(usdcBalance as bigint, 6),
        };

        cleanup = await monitorDeposit(
          address as `0x${string}`,
          initialBalances,
          (result) => {
            setStatus('success');
            setDepositInfo(result);
            onSuccess();
          },
          (error) => {
            console.error('Monitoring error:', error);
          },
          client,
          usdcAddress
        );
      } catch (error) {
        console.error('Failed to start monitoring:', error);
      }
    };

    startMonitoring();

    return () => {
      if (cleanup) cleanup();
    };
  }, [open, address, onSuccess]);

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      onOpenChange(false);
    }
  }, [status, countdown, onOpenChange]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-[420px] p-5 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Fund Your Account</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {status === 'success' && depositInfo ? (
            <div className="py-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <svg
                    className="w-20 h-20 animate-scale-in"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="text-green-500"
                      fill="none"
                      strokeDasharray="283"
                      strokeDashoffset="0"
                      style={{
                        animation: 'drawCircle 0.6s ease-out forwards'
                      }}
                    />
                    <path
                      d="M30 50 L45 65 L70 35"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-green-500"
                      fill="none"
                      strokeDasharray="70"
                      strokeDashoffset="70"
                      style={{
                        animation: 'drawCheck 0.4s ease-out 0.3s forwards'
                      }}
                    />
                  </svg>
                </div>
              </div>
              <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <p className="text-lg font-semibold text-green-600">
                  Deposit Received!
                </p>
                <p className="text-sm text-foreground">
                  {depositInfo.amount} {depositInfo.token}
                </p>
                <p className="text-xs text-muted-foreground">
                  Closing in {countdown}s...
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center py-3 border-b border-border">
                <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
                <p className="text-base font-semibold">{currentBalance} USDC</p>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-center text-muted-foreground">Your Deposit Address</p>
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-xs font-mono break-all text-center">
                      {address}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopy}
                      className="h-7 w-7 p-0 flex-shrink-0"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-center">
                {status === 'waiting' && (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Waiting for deposit...
                    </span>
                  </div>
                )}
                
                {status === 'checking' && (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs text-foreground">
                      Checking blockchain...
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1 pt-2 text-center">
                <p className="text-xs font-medium text-foreground">✨ Transactions on BaseStory are gasless</p>
                <p className="text-xs text-muted-foreground">Send USDC from any wallet for tipping</p>
                <p className="text-xs text-muted-foreground">Usually takes 10-30 seconds</p>
                <p className="text-xs text-muted-foreground">Minimum: 0.1 USDC</p>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onOpenChange(false)}
                className="w-full text-xs"
              >
                Close
              </Button>
            </>
          )}
        </div>
      </DialogContent>
      <style>{`
        @keyframes drawCircle {
          from {
            stroke-dashoffset: 283;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes drawCheck {
          from {
            stroke-dashoffset: 70;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </Dialog>
  );
};
