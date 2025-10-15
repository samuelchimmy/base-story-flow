import { useWallet } from './WalletProvider';
import { Button } from './ui/button';

export const Header = () => {
  const { isConnected, username, connect, disconnect } = useWallet();

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
            <>
              <span className="hidden sm:inline text-xs md:text-sm text-muted-foreground">
                {username}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                className="text-xs md:text-sm"
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              onClick={connect}
              size="sm"
              className="text-xs md:text-sm"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
