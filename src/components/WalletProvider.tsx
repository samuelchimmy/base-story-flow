// src/components/WalletProvider.tsx
// FINAL CORRECTED VERSION

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { createBaseAccountSDK } from '@base-org/account';
import { baseSepolia } from 'viem/chains'; // <-- CRITICAL FIX #1: Import baseSepolia
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
  provider: any; // Keep as any to avoid complex provider type issues for now
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
const generateUsername = () => {
  const adjectives = ['Anonymous', 'Secret', 'Hidden', 'Mystery', 'Shadow', 'Crypto'];
  const nouns = ['User', 'Writer', 'Storyteller', 'Narrator', 'Author', 'Sage'];
  const randomNum = Math.floor(Math.random() * 9999);
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun} ${randomNum}`;
};

// --- The Provider Component ---
export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [universalAddress, setUniversalAddress] = useState<Address | null>(null);
  const [subAccountAddress, setSubAccountAddress] = useState<Address | null>(null);
  const [username, setUsername] = useState('');
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<any>(null);

  // Initialize Base Account SDK
  useEffect(() => {
    const initializeSDK = () => {
      try {
        const sdkInstance = createBaseAccountSDK({
          appName: 'BaseStory',
          appLogoUrl: window.location.origin + '/favicon.ico',
          // --- CRITICAL FIX #1: Point SDK to Base Sepolia Testnet ---
          appChainIds: [baseSepolia.id], 
          subAccounts: {
            creation: 'on-connect',
            defaultAccount: 'sub',
          },
        });
        const providerInstance = sdkInstance.getProvider();
        setProvider(providerInstance);
        console.log('Base Account SDK initialized for Base Sepolia');
      } catch (error) {
        console.error('Failed to initialize Base Account SDK:', error);
      }
    };
    initializeSDK();
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!provider || !universalAddress) {
      setBalance('0.00');
      return;
    }
    try {
      const balanceData = `0x70a08231000000000000000000000000${universalAddress.substring(2)}`;
      const balanceHex = await provider.request({
        method: 'eth_call',
        params: [{ to: USDC_CONTRACT_ADDRESS, data: balanceData }, 'latest'],
      }) as string;
      const balanceWei = BigInt(balanceHex);
      const formattedBalance = (Number(balanceWei) / 1_000_000).toFixed(2);
      setBalance(formattedBalance);
    } catch (error) {
      console.error('❌ Failed to fetch USDC balance:', error);
      setBalance('0.00');
    }
  }, [provider, universalAddress]);

  const connect = useCallback(async () => {
    if (!provider) return;
    setLoading(true);
    try {
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
        params: [],
      }) as Address[];
      
      if (accounts.length > 0) {
        const universal = accounts[0];
        setUniversalAddress(universal);
        
        // With 'on-connect' and 'sub' as default, the sub-account is often the second address
        if (accounts.length > 1) {
            setSubAccountAddress(accounts[1]);
        }
        
        setIsConnected(true);
        setUsername(generateUsername());
        localStorage.setItem('walletConnected', 'true');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setLoading(false);
    }
  }, [provider]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setUniversalAddress(null);
    setSubAccountAddress(null);
    setUsername('');
    setBalance(null);
    localStorage.removeItem('walletConnected');
  }, []);

  // --- THE CORRECTED sendCalls HELPER FUNCTION ---
  const sendCalls = useCallback(async (calls: Call[]): Promise<string> => {
    if (!provider || !subAccountAddress) {
      throw new Error('Wallet not connected or Sub Account not available');
    }

    try {
      // --- CRITICAL FIX #2: Explicitly define the chainId for every transaction ---
      const chainIdHex = `0x${baseSepolia.id.toString(16)}`;

      const callsId = await provider.request({
        method: 'wallet_sendCalls',
        params: [
          {
            version: '2.0',
            atomicRequired: true,
            chainId: chainIdHex, // This ensures the wallet prompts for Base Sepolia ETH
            from: subAccountAddress,
            calls: calls.map(call => ({
              to: call.to,
              data: call.data || '0x',
              value: call.value || '0x0',
            })),
            capabilities: {},
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

  // Auto-connect on mount
  useEffect(() => {
    if (localStorage.getItem('walletConnected') === 'true' && provider) {
      connect();
    }
  }, [provider, connect]);

  // Fetch balance when connected
  useEffect(() => {
    if (isConnected && universalAddress) {
      fetchBalance();
    }
  }, [isConnected, universalAddress, fetchBalance]);

  return (
    <WalletContext.Provider
      value={{
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
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
