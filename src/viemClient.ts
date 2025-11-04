import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

// Use Ankr's public RPC which has better rate limits than the default Base RPC
export const publicClient = createPublicClient({
  chain: base,
  transport: http('https://rpc.ankr.com/base'),
}) as any; // Type assertion to avoid viem version conflicts
