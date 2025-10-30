import { useState } from 'react';
import { useWallet } from './WalletProvider';
import { Button } from './ui/button';
import { FundAccountButton } from './FundAccountButton';
import { FundAccountModal } from './FundAccountModal';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header = () => {
  const { isConnected, username, universalAddress, balance, loading, connect, disconnect, fetchBalance } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatAddress = (addr: string | null) => 
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  const copyAddress = async () => {
    if (universalAddress) {
      await navigator.clipboard.writeText(universalAddress);
      toast.success('Address copied to clipboard!');
    }
  };

  const showFundButton = balance !== null && parseFloat(balance) <= 0.1;

  return (
    // We are reverting to your original, simpler layout classes
    <header className="w-full border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="font-bangers text-2xl sm:text-3xl md:text-4xl leading-none hover:opacity-80 transition-opacity cursor-pointer">
            <span className="text-primary">Base</span>
            <span className="text-foreground">Story</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end mr-2">
                <button
                  onClick={copyAddress}
                  className="text-xs font-mono text-muted-foreground hidden md:flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                  title="Click to copy address"
                >
                  {formatAddress(universalAddress)}
                  <Copy className="w-3 h-3" />
                </button>
                <span className="text-xs md:text-sm font-semibold text-foreground">
                  {balance ? `${balance} USDC` : 'Loading...'}
                </span>
              </div>

              {showFundButton && <FundAccountButton onClick={() => setIsModalOpen(true)} />}
              
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                className="text-xs md:text-sm"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={connect}
              size="sm"
              disabled={loading}
              className="text-xs md:text-sm"
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </div>

      <FundAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        universalAddress={universalAddress || ''}
        currentBalance={balance || '0'}
        onBalanceUpdate={fetchBalance}
      />
    </header>
  );
};
