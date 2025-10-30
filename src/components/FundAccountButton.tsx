import { useWallet } from './WalletProvider';
import { Button } from './ui/button';

interface FundAccountButtonProps {
  onClick: () => void;
}

export const FundAccountButton = ({ onClick }: FundAccountButtonProps) => {
  const { universalAddress, balance } = useWallet();

  const currentBalance = parseFloat(balance || '0');
  const shouldShowButton = currentBalance <= 0.1;

  if (!shouldShowButton) return null;

  return (
    <Button
      onClick={onClick}
      disabled={!universalAddress}
      size="sm"
      variant="default"
      className="text-xs md:text-sm"
    >
      Add Funds
    </Button>
  );
};
