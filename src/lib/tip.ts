import { encodeFunctionData, type Address } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDC_ABI } from '@/config';

let cachedStoryTipAmount: bigint | null = null;

// Read TIP_AMOUNT from the Story contract (cached per session)
export async function getStoryTipAmount(provider: any): Promise<bigint> {
  if (!provider) throw new Error('Wallet provider not ready');
  if (cachedStoryTipAmount) return cachedStoryTipAmount;
  try {
    const data = encodeFunctionData({
      abi: CONTRACT_ABI as any,
      functionName: 'TIP_AMOUNT',
      args: [],
    });
    const hex = (await provider.request({
      method: 'eth_call',
      params: [
        { to: CONTRACT_ADDRESS, data },
        'latest',
      ],
    })) as string;
    const amount = BigInt(hex);
    cachedStoryTipAmount = amount;
    return amount;
  } catch (e) {
    // Fallback to 0.1 USDC if contract call fails (6 decimals)
    return 100_000n;
  }
}

// Check USDC balance and allowance for a given owner/spender pair
export async function checkUSDCPrereqs(
  provider: any,
  owner: Address,
  spender: Address,
  amount: bigint
): Promise<{ balance: bigint; allowance: bigint; hasBalance: boolean; hasAllowance: boolean }> {
  if (!provider) throw new Error('Wallet provider not ready');

  const balanceData = encodeFunctionData({
    abi: USDC_ABI as any,
    functionName: 'balanceOf',
    args: [owner],
  });
  const allowanceData = encodeFunctionData({
    abi: USDC_ABI as any,
    functionName: 'allowance',
    args: [owner, spender],
  });

  const [balanceHex, allowanceHex] = (await Promise.all([
    provider.request({ method: 'eth_call', params: [{ to: getUSDCAddress(), data: balanceData }, 'latest'] }),
    provider.request({ method: 'eth_call', params: [{ to: getUSDCAddress(), data: allowanceData }, 'latest'] }),
  ])) as [string, string];

  const balance = BigInt(balanceHex);
  const allowance = BigInt(allowanceHex);
  return {
    balance,
    allowance,
    hasBalance: balance >= amount,
    hasAllowance: allowance >= amount,
  };
}

export function formatUsdc(amount: bigint): string {
  try {
    return (Number(amount) / 1_000_000).toFixed(2);
  } catch {
    return '0.00';
  }
}

export function decodeRevert(error: any): string {
  const raw = String((error && (error.message || error.cause?.message)) || error || 'Unknown error');
  if (/useroperation reverted/i.test(raw) || /execution reverted/i.test(raw)) {
    if (/insufficient/i.test(raw) || /balance/i.test(raw)) return 'Insufficient balance or allowance.';
    if (/allowance/i.test(raw)) return 'USDC allowance too low.';
    if (/tip/i.test(raw)) return 'Tip failed. Please refresh and try again.';
    return 'Transaction would revert. Please check balance/inputs.';
  }
  if (/denied|rejected|User rejected/i.test(raw)) return 'User rejected the request.';
  if (/gas/i.test(raw)) return 'Failed to estimate gas. Please try again.';
  return raw;
}

// Small helper to get the USDC address without a direct import loop risk
function getUSDCAddress(): Address {
  // Type cast is safe since config exports const assertion
  return (USDC_ABI as any).__address || ('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address);
}
