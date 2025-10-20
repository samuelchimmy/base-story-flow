import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useWallet } from './WalletProvider';
import type { NetworkType } from '@/networkConfig';
import { NETWORKS } from '@/networkConfig';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const NetworkSwitcher = () => {
  const { currentNetwork, switchNetwork } = useWallet();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetNetwork, setTargetNetwork] = useState<NetworkType | null>(null);

  const currentConfig = NETWORKS[currentNetwork];

  const handleNetworkClick = (network: NetworkType) => {
    if (network === currentNetwork) {
      setOpen(false);
      return;
    }
    setTargetNetwork(network);
    setOpen(false);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (targetNetwork) {
      switchNetwork(targetNetwork);
      setConfirmOpen(false);
      setTargetNetwork(null);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-2 text-xs"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                currentConfig.isTestnet ? 'bg-orange-500' : 'bg-blue-500'
              }`}
            />
            <span>{currentConfig.shortName}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          <div className="space-y-1">
            {(Object.keys(NETWORKS) as NetworkType[]).map((network) => {
              const config = NETWORKS[network];
              const isActive = network === currentNetwork;
              
              return (
                <button
                  key={network}
                  onClick={() => handleNetworkClick(network)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted transition-colors"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      config.isTestnet ? 'bg-orange-500' : 'bg-blue-500'
                    }`}
                  />
                  <span className="flex-1 text-left">{config.name}</span>
                  {isActive && <Check className="h-3 w-3 text-primary" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base">Switch Network?</DialogTitle>
            <DialogDescription className="text-xs">
              Switching to {targetNetwork && NETWORKS[targetNetwork].name} will refresh your
              connection and update all contract interactions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirm} className="text-xs">
              Switch Network
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
