import { useState } from 'react';
import { useWallet } from './WalletProvider';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const FundAccountButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { universalAddress, balance, fetchBalance } = useWallet();

  const currentBalance = parseFloat(balance || '0');
  const hasSufficientBalance = currentBalance > 0.1;

  const handleFund = async () => {
    if (!universalAddress) {
      toast.error('No wallet connected');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('faucet', {
        body: { address: universalAddress },
      });

      if (error) {
        console.error('Supabase function invocation error:', error);
        toast.error('Failed to fund account', {
          description: error.message || 'Unknown error',
        });
        return;
      }

      // Check if the response contains an error from the function
      if (data?.error) {
        toast.error(data.error, {
          description: data.message || 'Please try again later',
        });
        return;
      }

      // Success response
      if (data?.success) {
        toast.success(data.message || 'USDC sent successfully!', {
          description: data.transactionHash 
            ? `View on explorer: ${data.transactionHash.slice(0, 10)}...` 
            : 'Funds will arrive shortly',
          action: data.explorerUrl ? {
            label: 'View Transaction',
            onClick: () => window.open(data.explorerUrl, '_blank'),
          } : undefined,
        });

        // Refresh balance after a few seconds
        setTimeout(() => {
          fetchBalance();
        }, 5000);
      }
    } catch (error) {
      console.error('Faucet error:', error);
      toast.error('Failed to fund account', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleFund}
      disabled={isLoading || hasSufficientBalance || !universalAddress}
      size="sm"
      variant="secondary"
      className="text-xs md:text-sm"
    >
      {isLoading ? 'Funding...' : hasSufficientBalance ? 'Sufficient Balance' : 'Fund Account'}
    </Button>
  );
};
