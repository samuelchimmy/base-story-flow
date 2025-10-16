// src/components/WalletProvider.tsx
// FINAL CORRECTED VERSION (with minimal payload)

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { createBaseAccountSDK } from '@base-org/account';
import { baseSepolia } from 'viem/chains';
import type { Address } from 'viem';

// --- Type Definitions ---
const USDC_CONTRACT_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;

interface SubAccount {
  address: Address;
  factory?: Address;
  factoryData?: `0x${string}`;
}

type Call = {
  to: Address;
  data?: `0x${string}`;
  value?: string;
};

interface WalletContextType {
  isConnected: boolean;
  universalAddress: Address | null;
  subAccountAddress: Address | null;
  username: string;
  balance: string | null;
  loading: boolean;
  provider: any;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendCalls: (calls: Call[]) => Promise<string>;
  fetchBalance: () => Promise<void>;
}

// --- Context Setup ---
const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

// --- Helper Functions ---
const generateUsername = () => { /* ... same as before ... */ };

// --- The Provider Component ---
export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [universalAddress, setUniversalAddress] = useState<Address | null>(null);
  const [subAccountAddress, setSubAccountAddress] = useState<Address | null>(null);
  const [username, setUsername] = useState('');
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<any>(null);

  // Initialize SDK (same as before)
  useEffect(() => {
    const initializeSDK = () => {
      try {
        const sdkInstance = createBaseAccountSDK({
          appName: 'BaseStory',
          appLogoUrl: window.location.origin + '/favicon.ico',
          appChainIds: [baseSepolia.id],
          subAccounts: { creation: 'on-connect', defaultAccount: 'sub' },
        });
        setProvider(sdkInstance.getProvider());
      } catch (error) {
        console.error('Failed to initialize Base Account SDK:', error);
      }
    };
    initializeSDK();
  }, []);

  // fetchBalance, connect, disconnect (same as before)
  const fetchBalance = useCallback(async () => { /* ... same as before ... */ }, [provider, universalAddress]);
  const connect = useCallback(async () => { /* ... same as before ... */ }, [provider]);
  const disconnect = useCallback(() => { /* ... same as before ... */ }, []);

  // --- THE CORRECTED sendCalls HELPER FUNCTION (Minimal Payload) ---
  const sendCalls = useCallback(async (calls: Call[]): Promise<string> => {
    if (!provider || !subAccountAddress) {
      throw new Error('Wallet not connected or Sub Account not available');
    }
    try {
      const chainIdHex = `0x${baseSepolia.id.toString(16)}`;
      const callsId = await provider.request({
        method: 'wallet_sendCalls',
        params: [
          {
            version: '2.0', // This is still required
            chainId: chainIdHex,
            from: subAccountAddress,
            calls: calls.map(call => ({
              to: call.to,
              data: call.data || '0x',
              value: call.value || '0x0',
            })),
            // The `atomicRequired` and `capabilities` fields have been removed
          },
        ],
      }) as string;
      console.log('Calls sent successfully on Base Sepolia:', callsId);
      return callsId;
    } catch (error) {
      console.error('Failed to send calls:', error);
      throw error;
    }
  }, [provider, subAccountAddress]);

  // useEffects for auto-connect and balance fetching (same as before)
  useEffect(() => { /* ... same as before ... */ }, [provider, connect]);
  useEffect(() => { /* ... same as before ... */ }, [isConnected, universalAddress, fetchBalance]);

  return (
    <WalletContext.Provider value={{
      isConnected,
      universalAddress,
      subAccountAddress,
      username,
      balance,
      loading,
      provider,
      connect,
      disconnect,
      sendCalls,
      fetchBalance,
    }}>
      {children}
    </WalletContext.Provider>
  );
};
