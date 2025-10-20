import { formatUnits, formatEther, type PublicClient } from 'viem';

const USDC_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
] as const;

interface BalanceSnapshot {
  usdc: string;
  eth: string;
}

export interface DepositResult {
  token: 'USDC' | 'ETH';
  amount: string;
  newBalance: string;
}

export async function monitorDeposit(
  address: `0x${string}`,
  initialBalances: BalanceSnapshot,
  onDeposit: (result: DepositResult) => void,
  onError: (error: Error) => void,
  publicClient: PublicClient,
  usdcAddress: `0x${string}`
): Promise<() => void> {
  let isActive = true;
  
  const poll = async () => {
    if (!isActive) return;
    
    try {
      const [currentUsdc, currentEth] = await Promise.all([
        publicClient.readContract({
          address: usdcAddress,
          abi: USDC_ABI,
          functionName: 'balanceOf',
          args: [address],
        } as any),
        publicClient.getBalance({ address }),
      ]);
      
      const usdcBalance = formatUnits(currentUsdc as bigint, 6);
      const ethBalance = formatEther(currentEth);
      
      // Check for USDC deposit
      if (parseFloat(usdcBalance) > parseFloat(initialBalances.usdc)) {
        const depositAmount = (
          parseFloat(usdcBalance) - parseFloat(initialBalances.usdc)
        ).toFixed(2);
        onDeposit({
          token: 'USDC',
          amount: depositAmount,
          newBalance: usdcBalance,
        });
        isActive = false;
        return;
      }
      
      // Check for ETH deposit
      if (parseFloat(ethBalance) > parseFloat(initialBalances.eth)) {
        const depositAmount = (
          parseFloat(ethBalance) - parseFloat(initialBalances.eth)
        ).toFixed(4);
        onDeposit({
          token: 'ETH',
          amount: depositAmount,
          newBalance: ethBalance,
        });
        isActive = false;
        return;
      }
      
      setTimeout(poll, 3000);
      
    } catch (error) {
      onError(error as Error);
      setTimeout(poll, 5000);
    }
  };
  
  poll();
  
  return () => {
    isActive = false;
  };
}
