import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

// Use LlamaRPC's public endpoint which has better rate limits and no auth required
export const publicClient = createPublicClient({
  chain: base,
  transport: http('https://base.llamarpc.com'),
}) as any; // Type assertion to avoid viem version conflicts
