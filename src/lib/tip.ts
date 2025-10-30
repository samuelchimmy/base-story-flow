import { encodeFunctionData, decodeFunctionResult } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDC_CONTRACT_ADDRESS, USDC_ABI } from '@/config';

// Extended USDC ABI with balanceOf and allowance
const EXTENDED_USDC_ABI = [
  ...USDC_ABI,
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
] as const;

// Cache for tip amount (session-level)
let cachedTipAmount: bigint | null = null;

/**
 * Read TIP_AMOUNT from the contract
 */
export async function getTipAmount(provider: any): Promise<bigint> {
  if (cachedTipAmount !== null) {
    return cachedTipAmount;
  }

  try {
    const calldata = encodeFunctionData({
      abi: CONTRACT_ABI,
      functionName: 'TIP_AMOUNT',
    });

    const result = await provider.request({
      method: 'eth_call',
      params: [
        {
          to: CONTRACT_ADDRESS,
          data: calldata,
        },
        'latest',
      ],
    });

    const decoded = decodeFunctionResult({
      abi: CONTRACT_ABI,
      functionName: 'TIP_AMOUNT',
      data: result,
    });

    cachedTipAmount = decoded as bigint;
    return cachedTipAmount;
  } catch (error) {
    console.error('Failed to fetch TIP_AMOUNT:', error);
    // Fallback to 0.1 USDC (100000 units with 6 decimals)
    return 100000n;
  }
}

/**
 * Check if user has enough USDC balance and allowance for tipping
 */
export async function checkTipPrereqs(
  provider: any,
  fromAddress: string,
  tipAmount: bigint
): Promise<{
  hasBalance: boolean;
  hasAllowance: boolean;
  balance: bigint;
  allowance: bigint;
}> {
  try {
    // Check USDC balance
    const balanceCalldata = encodeFunctionData({
      abi: EXTENDED_USDC_ABI,
      functionName: 'balanceOf',
      args: [fromAddress as `0x${string}`],
    });

    const balanceResult = await provider.request({
      method: 'eth_call',
      params: [
        {
          to: USDC_CONTRACT_ADDRESS,
          data: balanceCalldata,
        },
        'latest',
      ],
    });

    const balance = decodeFunctionResult({
      abi: EXTENDED_USDC_ABI,
      functionName: 'balanceOf',
      data: balanceResult,
    }) as bigint;

    // Check USDC allowance
    const allowanceCalldata = encodeFunctionData({
      abi: EXTENDED_USDC_ABI,
      functionName: 'allowance',
      args: [fromAddress as `0x${string}`, CONTRACT_ADDRESS],
    });

    const allowanceResult = await provider.request({
      method: 'eth_call',
      params: [
        {
          to: USDC_CONTRACT_ADDRESS,
          data: allowanceCalldata,
        },
        'latest',
      ],
    });

    const allowance = decodeFunctionResult({
      abi: EXTENDED_USDC_ABI,
      functionName: 'allowance',
      data: allowanceResult,
    }) as bigint;

    return {
      hasBalance: balance >= tipAmount,
      hasAllowance: allowance >= tipAmount,
      balance,
      allowance,
    };
  } catch (error) {
    console.error('Failed to check tip prerequisites:', error);
    return {
      hasBalance: false,
      hasAllowance: false,
      balance: 0n,
      allowance: 0n,
    };
  }
}

/**
 * Decode revert error messages
 */
export function decodeRevert(error: any): string {
  const errorStr = String(error?.message || error || '');

  if (errorStr.includes('InvalidTipAmount')) {
    return 'The tip amount differs from what the contract expects. Please refresh and try again.';
  }

  if (
    errorStr.includes('InsufficientBalance') ||
    errorStr.includes('insufficient funds') ||
    errorStr.includes('transfer amount exceeds balance')
  ) {
    return 'Insufficient USDC balance for this tip.';
  }

  if (errorStr.includes('user rejected') || errorStr.includes('User denied')) {
    return 'Transaction cancelled by user.';
  }

  if (errorStr.includes('gas')) {
    return 'Transaction failed during gas estimation. Please check your balance and try again.';
  }

  return 'Transaction failed. Please try again.';
}
