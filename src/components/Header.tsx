import { useWallet } from './WalletProvider';
import { Button } from './ui/button';
import { FundAccountButton } from './FundAccountButton';

export const Header = () => {
  const { isConnected, username, universalAddress, balance, loading, connect, disconnect } = useWallet();

  const formatAddress = (addr: string | null) => 
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  return (
    <header className="w-full border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-bangers text-2xl sm:text-3xl md:text-4xl leading-none">
            <span className="text-primary">Base</span>
            <span className="text-foreground">Story</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {formatAddress(universalAddress)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {balance ? `${balance} ETH` : 'Loading...'}
                </span>
              </div>
              <span className="hidden sm:inline md:hidden text-xs text-muted-foreground">
                {username}
              </span>
              <FundAccountButton />
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
    </header>
  );
};
