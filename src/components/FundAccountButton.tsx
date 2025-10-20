import { useState } from 'react';
import { Button } from './ui/button';
import { useWallet } from './WalletProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FundingCard } from './FundingCard';
import { Wallet, Droplet } from 'lucide-react';

export const FundAccountButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [fundingCardOpen, setFundingCardOpen] = useState(false);
  const { universalAddress, balance, fetchBalance, isTestnet } = useWallet();

  const handleFund = async () => {
    if (!universalAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isTestnet) {
      setFundingCardOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('faucet', {
        body: { address: universalAddress },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Account funded successfully!', {
          description: data.message,
        });
        
        setTimeout(() => {
          fetchBalance();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to fund account:', error);
      toast.error('Failed to fund account', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buttonDisabled = isLoading || !universalAddress || (balance !== null && parseFloat(balance) > 0.1);
  const buttonText = isLoading 
    ? 'Funding...' 
    : (balance !== null && parseFloat(balance) > 0.1) 
      ? 'Sufficient Balance' 
      : isTestnet 
        ? 'Fund Account'
        : 'Add Funds';

  return (
    <>
      <Button
        onClick={handleFund}
        disabled={buttonDisabled}
        size="sm"
        variant="outline"
        className="text-xs md:text-sm flex items-center gap-1.5"
      >
        {isTestnet ? (
          <Droplet className="w-3 h-3" />
        ) : (
          <Wallet className="w-3 h-3" />
        )}
        {buttonText}
      </Button>

      {!isTestnet && universalAddress && (
        <FundingCard
          open={fundingCardOpen}
          onOpenChange={setFundingCardOpen}
          address={universalAddress}
          currentBalance={balance || '0.00'}
          onSuccess={fetchBalance}
        />
      )}
    </>
  );
};
