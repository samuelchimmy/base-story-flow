import { createPublicClient, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import type { NetworkType } from './networkConfig';
import { NETWORKS } from './networkConfig';

// Function to get a public client for a specific network
export const getPublicClient = (network: NetworkType = 'base') => {
  const config = NETWORKS[network];
  return createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrl),
  }) as any;
};

// Default client for backwards compatibility (Base Mainnet)
export const publicClient = getPublicClient('base');
