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
        
        const [usdcBalance, ethBalance] = await Promise.all([
          client.readContract({
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
          } as any),
          client.getBalance({ address: address as `0x${string}` }),
        ]);

        const initialBalances = {
          usdc: formatUnits(usdcBalance as bigint, 6),
          eth: formatEther(ethBalance),
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
      <DialogContent className="sm:max-w-[420px] p-5">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Fund Your Account</DialogTitle>
          <p className="text-xs text-muted-foreground">Send USDC or ETH to get started</p>
        </DialogHeader>

        <div className="space-y-4">
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
            
            {status === 'success' && depositInfo && (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-green-600">
                  <Check className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    Received {depositInfo.amount} {depositInfo.token}!
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Closing in {countdown}s...
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1 pt-2 text-center">
            <p className="text-xs text-muted-foreground">Send USDC or ETH from any wallet</p>
            <p className="text-xs text-muted-foreground">Usually takes 10-30 seconds</p>
            <p className="text-xs text-muted-foreground">Minimum: 0.1 USDC or 0.0001 ETH</p>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onOpenChange(false)}
            className="w-full text-xs"
            disabled={status === 'success'}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
