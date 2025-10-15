import { useState } from 'react';
import { useWallet } from './WalletProvider';
import { Button } from './ui/button';
import { toast } from 'sonner';

export const FundAccountButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { universalAddress, fetchBalance } = useWallet();

  const handleFund = async () => {
    if (!universalAddress) return;

    setIsLoading(true);
    try {
      // For now, direct users to the Base Sepolia faucet
      // In production, you would call your backend API endpoint
      toast.info('Opening Base Sepolia Faucet...', {
        description: 'Get test ETH for your account',
      });
      
      // Open Base Sepolia faucet in new tab
      window.open(`https://www.coinbase.com/faucets/base-sepolia-faucet`, '_blank');
      
      // Refresh balance after a delay
      setTimeout(() => {
        fetchBalance();
        toast.success('Balance refresh scheduled', {
          description: 'Your balance will update shortly',
        });
      }, 3000);
    } catch (error) {
      console.error('Faucet error:', error);
      toast.error('Failed to open faucet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleFund}
      disabled={isLoading}
      size="sm"
      variant="secondary"
      className="text-xs md:text-sm"
    >
      {isLoading ? 'Opening...' : 'Get Testnet ETH'}
    </Button>
  );
};
