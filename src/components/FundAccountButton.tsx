import { useState } from 'react';
import { useWallet } from './WalletProvider';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const FundAccountButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  // --- DEBUG STEP 1: Import subAccountAddress as well ---
  const { universalAddress, subAccountAddress, balance, fetchBalance } = useWallet();

  const currentBalance = parseFloat(balance || '0');
  const hasSufficientBalance = currentBalance > 0.1;

  const handleFund = async () => {
    if (!universalAddress) {
      toast.error('No wallet connected');
      return;
    }

    // --- DEBUG STEP 2: Add console logs to expose the state ---
    console.log("--- Faucet Button Clicked: Debug Info ---");
    console.log("Address being sent to backend:", universalAddress);
    console.log("For reference, the Sub Account address is:", subAccountAddress);
    console.log("-----------------------------------------");
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('faucet', {
        // The code remains the same, sending the `universalAddress` variable
        body: { address: universalAddress },
      });

      if (error) {
        console.error('Supabase function invocation error:', error);
        toast.error('Failed to fund account', {
          description: error.message || 'Unknown error',
        });
        return;
      }

      if (data?.error) {
        toast.error(data.error, {
          description: data.message || 'Please try again later',
        });
        return;
      }

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

        fetchBalance();
        setTimeout(() => {
          fetchBalance();
        }, 3000);
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
