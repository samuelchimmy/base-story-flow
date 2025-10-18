import { publicClient } from '@/viemClient';
import { AMA_CONTRACT_ADDRESS, AMA_CONTRACT_ABI } from '@/config';

export interface AMA {
  id: bigint;
  creator: string;
  headingURI: string;
  descriptionURI: string;
  requiresTip: boolean;
  tipAmount: bigint;
  isPublic: boolean;
  messageCount: bigint;
}

export interface AMAMessage {
  id: bigint;
  amaId: bigint;
  sender: string;
  contentURI: string;
  loveCount: bigint;
  tipCount: bigint;
  timestamp: bigint;
}

/**
 * Fetch all AMAs from the blockchain
 */
export async function getAllAMAs(): Promise<AMA[]> {
  try {
    const data = await publicClient.readContract({
      address: AMA_CONTRACT_ADDRESS,
      abi: AMA_CONTRACT_ABI,
      functionName: 'getAllAMAs',
    }) as any[];

    // Augment each AMA with messageCount fetched from contract
    const withCounts = await Promise.all(
      data.map(async (ama) => {
        const count = await publicClient.readContract({
          address: AMA_CONTRACT_ADDRESS,
          abi: AMA_CONTRACT_ABI,
          functionName: 'getAMAMessageCount',
          args: [ama.id],
        }) as bigint;
        return { ...ama, messageCount: count } as AMA;
      })
    );

    return withCounts;
  } catch (error) {
    console.error('Error fetching AMAs:', error);
    return [];
  }
}

/**
 * Get a specific AMA by ID
 */
export async function getAMA(amaId: bigint): Promise<AMA | null> {
  try {
    const data = await publicClient.readContract({
      address: AMA_CONTRACT_ADDRESS,
      abi: AMA_CONTRACT_ABI,
      functionName: 'getAMA',
      args: [amaId],
    }) as any;

    const count = await publicClient.readContract({
      address: AMA_CONTRACT_ADDRESS,
      abi: AMA_CONTRACT_ABI,
      functionName: 'getAMAMessageCount',
      args: [amaId],
    }) as bigint;

    return { ...data, messageCount: count } as AMA;
  } catch (error) {
    console.error('Error fetching AMA:', error);
    return null;
  }
}

/**
 * Get paginated messages for an AMA
 */
export async function getAMAMessages(
  amaId: bigint,
  offset: bigint = 0n,
  limit: bigint = 50n
): Promise<AMAMessage[]> {
  try {
    const data = await publicClient.readContract({
      address: AMA_CONTRACT_ADDRESS,
      abi: AMA_CONTRACT_ABI,
      functionName: 'getAMAMessagesPaginated',
      args: [amaId, offset, limit],
    }) as AMAMessage[];

    return data;
  } catch (error) {
    console.error('Error fetching AMA messages:', error);
    return [];
  }
}

/**
 * Format timestamp from blockchain (bigint seconds) to JavaScript Date
 */
export function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  const minutes = Math.floor(diff / (1000 * 60));
  return minutes > 0 ? `${minutes}m ago` : 'Just now';
}
