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
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { createBaseAccountSDK } from '@base-org/account';
// --- FIX #1: Change 'base' to 'baseSepolia' to target the correct testnet ---
import { baseSepolia } from 'viem/chains'; 
import type { Address } from 'viem';

const USDC_CONTRACT_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const; // Base Sepolia USDC

interface SubAccount {
  address: Address;
  factory?: Address;
  factoryData?: `0x${string}`;
}

interface WalletContextType {
  isConnected: boolean;
  universalAddress: Address | null;
  subAccountAddress: Address | null;
  username: string;
  balance: string | null;
  loading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendCalls: (calls: Array<{ to: Address; data?: `0x${string}`; value?: string }>) => Promise<string>;
  fetchBalance: () => Promise<void>;
  // provider prop can be added here if needed by other components
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

const generateUsername = () => {
  const adjectives = ['Anonymous', 'Secret', 'Hidden', 'Mystery', 'Shadow', 'Crypto'];
  const nouns = ['User', 'Writer', 'Storyteller', 'Narrator', 'Author', 'Sage'];
  const randomNum = Math.floor(Math.random() * 9999);
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun} ${randomNum}`;
};

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
    const initializeSDK = async () => {
      try {
        // Create SDK instance with Sub Account auto-creation enabled
        const sdkInstance = createBaseAccountSDK({
          appName: 'BaseStory',
          appLogoUrl: window.location.origin + '/favicon.ico',
          // --- FIX #1 (continued): Use baseSepolia.id here ---
          appChainIds: [baseSepolia.id], 
          subAccounts: {
            creation: 'on-connect', // Auto-create sub account on connect
            defaultAccount: 'sub',   // Use sub account by default
          },
        });

        // Get the EIP-1193 provider
        const providerInstance = sdkInstance.getProvider();
        setProvider(providerInstance);
        
        console.log('Base Account SDK initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Base Account SDK:', error);
      }
    };

    initializeSDK();
  }, []);

  const fetchBalance = useCallback(async () => {
    console.log('[DEBUG] 🔍 fetchBalance called');
    console.log('[DEBUG] Provider exists:', !!provider);
    console.log('[DEBUG] universalAddress:', universalAddress);
    
    if (!provider || !universalAddress) {
      console.log('[DEBUG] ❌ Cannot fetch balance: missing provider or address');
      console.log('[DEBUG] Provider:', !!provider, 'Address:', universalAddress);
      setBalance('0.00');
      return;
    }

    try {
      // Construct the calldata for balanceOf(address) function
      // 4-byte function selector (0x70a08231) + 32-byte padded address
      const balanceData = `0x70a08231000000000000000000000000${universalAddress.substring(2)}`;
      
      console.log('[DEBUG] 📞 Fetching USDC balance for:', universalAddress);
      console.log('[DEBUG] Calldata:', balanceData);
      console.log('[DEBUG] USDC Contract:', USDC_CONTRACT_ADDRESS);
      
      const balanceHex = await provider.request({
        method: 'eth_call',
        params: [
          {
            to: USDC_CONTRACT_ADDRESS,
            data: balanceData,
          },
          'latest',
        ],
      }) as string;
      
      console.log('[DEBUG] 📥 Raw hex balance from contract:', balanceHex);
      
      // Convert hex result to BigInt (handles large numbers correctly)
      const balanceWei = BigInt(balanceHex);
      console.log('[DEBUG] 🔢 Balance as BigInt:', balanceWei.toString());
      
      // Format with USDC's 6 decimals
      const formattedBalance = (Number(balanceWei) / 1_000_000).toFixed(2);
      console.log('[DEBUG] 💰 Formatted balance:', formattedBalance, 'USDC');
      
      setBalance(formattedBalance);
      console.log('[DEBUG] ✅ Balance state updated to:', formattedBalance, 'USDC');
    } catch (error) {
      console.error('❌ Failed to fetch USDC balance:', error);
      setBalance('0.00');
    }
  }, [provider, universalAddress]);

  const connect = useCallback(async () => {
    console.log('[DEBUG] 🔌 connect() called');
    
    if (!provider) {
      console.error('[DEBUG] ❌ Provider not initialized');
      return;
    }

    setLoading(true);
    try {
      console.log('[DEBUG] 📡 Requesting accounts from provider...');
      
      // Request account connection - this will trigger Sub Account creation
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
        params: [],
      }) as Address[];

      console.log('[DEBUG] 📋 Accounts received:', accounts);
      console.log('[DEBUG] Number of accounts:', accounts.length);

      if (accounts.length > 0) {
        const universal = accounts[0];
        console.log('[DEBUG] 🎯 Universal Address:', universal);
        
        setUniversalAddress(universal);
        console.log('[DEBUG] ✓ universalAddress state updated');
        
        setIsConnected(true);
        console.log('[DEBUG] ✓ isConnected set to true');
        
        setUsername(generateUsername());
        console.log('[DEBUG] ✓ Username generated');

        // Check for Sub Account (should be auto-created with 'on-connect' setting)
        try {
          console.log('[DEBUG] 🔍 Checking for Sub Account...');
          
          const response = await provider.request({
            method: 'wallet_getSubAccounts',
            params: [
              {
                account: universal,
                domain: window.location.origin,
              },
            ],
          }) as { subAccounts: SubAccount[] };

          console.log('[DEBUG] Sub Account response:', response);

          if (response.subAccounts && response.subAccounts.length > 0) {
            const subAcc = response.subAccounts[0];
            setSubAccountAddress(subAcc.address);
            console.log('[DEBUG] ✓ Sub Account found:', subAcc.address);
          } else {
            // If no sub account exists, create one manually
            console.log('[DEBUG] ⚠️ No Sub Account found, creating one...');
            const newSubAccount = await provider.request({
              method: 'wallet_addSubAccount',
              params: [
                {
                  account: {
                    type: 'create',
                  },
                },
              ],
            }) as SubAccount;
            
            setSubAccountAddress(newSubAccount.address);
            console.log('[DEBUG] ✓ Sub Account created:', newSubAccount.address);
          }
        } catch (subAccountError) {
          console.error('[DEBUG] ❌ Failed to get/create Sub Account:', subAccountError);
        }

        // Store connection state
        localStorage.setItem('walletConnected', 'true');
        console.log('[DEBUG] ✓ Connection state saved to localStorage');
        
        // Fetch balance
        console.log('[DEBUG] 💵 Calling fetchBalance() after connection...');
        fetchBalance();
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setLoading(false);
    }
  }, [provider, fetchBalance]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setUniversalAddress(null);
    setSubAccountAddress(null);
    setUsername('');
    setBalance(null);
    localStorage.removeItem('walletConnected');
  }, []);


  const sendCalls = useCallback(async (
    calls: Array<{ to: Address; data?: `0x${string}`; value?: string }>
  ): Promise<string> => {
    if (!provider || !subAccountAddress) {
      throw new Error('Wallet not connected or Sub Account not available');
    }

    try {
      const callsId = await provider.request({
        method: 'wallet_sendCalls',
        params: [
          {
            // --- FIX #2 & #3: Simplify payload and use correct chainId ---
            version: '2.0',
            chainId: `0x${baseSepolia.id.toString(16)}`, // Use baseSepolia.id
            from: subAccountAddress,
            calls: calls.map(call => ({
              to: call.to,
              data: call.data || '0x',
              value: call.value || '0x0',
            })),
            // 'atomicRequired' and 'capabilities' fields removed to fix "version" error
          },
        ],
      }) as string;

      console.log('Calls sent successfully:', callsId);
      return callsId;
    } catch (error) {
      console.error('Failed to send calls:', error);
      throw error;
    }
  }, [provider, subAccountAddress]);

  // Auto-connect on mount if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem('walletConnected');
    if (wasConnected === 'true' && provider) {
      connect();
    }
  }, [provider, connect]);

  // Poll balance every 10 seconds when connected
  useEffect(() => {
    console.log('[DEBUG] 🔄 Balance polling useEffect triggered');
    console.log('[DEBUG] isConnected:', isConnected);
    console.log('[DEBUG] universalAddress:', universalAddress);
    
    if (!isConnected || !universalAddress) {
      console.log('[DEBUG] ⏸️ Not polling: wallet not connected or no address');
      return;
    }

    // Initial fetch
    console.log('[DEBUG] ▶️ Starting balance polling...');
    fetchBalance();

    // Set up polling interval
    const intervalId = setInterval(() => {
      console.log('[DEBUG] ⏰ Polling interval triggered - fetching balance...');
      fetchBalance();
    }, 10000); // Poll every 10 seconds

    return () => {
      console.log('[DEBUG] 🛑 Cleaning up balance polling interval');
      clearInterval(intervalId);
    };
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
