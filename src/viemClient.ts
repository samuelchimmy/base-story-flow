import { createPublicClient, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';

export const publicClient = createPublicClient({
  chain: base,
  transport: http(),
}) as any;

export const getPublicClient = (chainId: number) => {
  const chain = chainId === 8453 ? base : baseSepolia;
  return createPublicClient({
    chain,
    transport: http(),
  }) as any;
};
