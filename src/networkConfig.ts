import { base, baseSepolia } from 'viem/chains';

export type NetworkType = 'base' | 'baseSepolia';

export interface NetworkConfig {
  id: number;
  chain: typeof base | typeof baseSepolia;
  name: string;
  shortName: string;
  contracts: {
    baseStory: `0x${string}`;
    baseAMA: `0x${string}`;
    usdc: `0x${string}`;
  };
  blockExplorer: string;
  rpcUrl: string;
  isTestnet: boolean;
}

export const NETWORKS: Record<NetworkType, NetworkConfig> = {
  base: {
    id: 8453,
    chain: base,
    name: 'Base',
    shortName: 'Mainnet',
    contracts: {
      baseStory: '0xF3f064Cca43bc3Da3831e45d32a5c9311f42B7e9',
      baseAMA: '0x9102B3e196e74D3e24C1594c0f184Abb3A10DDCF',
      usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
    blockExplorer: 'https://basescan.org',
    rpcUrl: 'https://mainnet.base.org',
    isTestnet: false,
  },
  baseSepolia: {
    id: 84532,
    chain: baseSepolia,
    name: 'Base Sepolia',
    shortName: 'Testnet',
    contracts: {
      baseStory: '0x8766cB332ABcAb9B7B77C8415313631072838a9C',
      baseAMA: '0x8766cB332ABcAb9B7B77C8415313631072838a9C',
      usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    },
    blockExplorer: 'https://sepolia.basescan.org',
    rpcUrl: 'https://sepolia.base.org',
    isTestnet: true,
  },
} as const;

export const DEFAULT_NETWORK: NetworkType = 'base';

export function getNetworkConfig(network: NetworkType): NetworkConfig {
  return NETWORKS[network];
}

export function getContractAddress(
  network: NetworkType,
  contract: 'baseStory' | 'baseAMA' | 'usdc'
): `0x${string}` {
  return NETWORKS[network].contracts[contract];
}
