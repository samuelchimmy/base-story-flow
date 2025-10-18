import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { createBaseAccountSDK } from '@base-org/account';
import { baseSepolia } from 'viem/chains'; 
import type { Address } from 'viem';

const USDC_CONTRACT_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;

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
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendCalls: (calls: Array<{ to: Address; data?: `0x${string}`; value?: string }>) => Promise<string>;
  getCallsStatus: (id: string) => Promise<any>;
  fetchBalance: () => Promise<void>;
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
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);
  
  // Use refs to track mounted state and prevent race conditions
  const isMounted = useRef(true);
  const isConnecting = useRef(false);

  // Initialize Base Account SDK
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        const sdkInstance = createBaseAccountSDK({
          appName: 'BaseStory',
          appLogoUrl: window.location.origin + '/favicon.ico',
          appChainIds: [baseSepolia.id], 
          subAccounts: {
            creation: 'on-connect',
            defaultAccount: 'sub',
          },
        });

        const providerInstance = sdkInstance.getProvider();
        if (isMounted.current) {
          setProvider(providerInstance);
          console.log('Base Account SDK initialized successfully');
        }
      } catch (error) {
        console.error('Failed to initialize Base Account SDK:', error);
        if (isMounted.current) {
          setError('Failed to initialize wallet SDK');
        }
      }
    };

    initializeSDK();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Stable fetchBalance using useCallback with minimal dependencies
  const fetchBalance = useCallback(async () => {
    console.log('[DEBUG] 🔍 fetchBalance called');
    
    if (!provider) {
      console.log('[DEBUG] ❌ Cannot fetch balance: missing provider');
      setBalance('0.00');
      return;
    }

    // Get current address from state at call time
    const currentAddress = universalAddress;
    if (!currentAddress) {
      console.log('[DEBUG] ❌ Cannot fetch balance: no address');
      setBalance('0.00');
      return;
    }

    try {
      const balanceData = `0x70a08231000000000000000000000000${currentAddress.substring(2)}`;
      
      console.log('[DEBUG] 📞 Fetching USDC balance for:', currentAddress);
      
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
      
      console.log('[DEBUG] 📥 Raw hex balance:', balanceHex);
      
      const balanceWei = BigInt(balanceHex);
      const formattedBalance = (Number(balanceWei) / 1_000_000).toFixed(2);
      
      console.log('[DEBUG] 💰 Formatted balance:', formattedBalance, 'USDC');
      
      if (isMounted.current) {
        setBalance(formattedBalance);
      }
    } catch (error) {
      console.error('❌ Failed to fetch USDC balance:', error);
      if (isMounted.current) {
        setBalance('0.00');
      }
    }
  }, [provider, universalAddress]);

  const connect = useCallback(async () => {
    console.log('[DEBUG] 🔌 connect() called');
    
    if (!provider) {
      console.warn('[DEBUG] ⚠️ Provider not initialized, attempting lazy init...');
      try {
        const sdkInstance = createBaseAccountSDK({
          appName: 'BaseStory',
          appLogoUrl: window.location.origin + '/favicon.ico',
          appChainIds: [baseSepolia.id],
          subAccounts: {
            creation: 'on-connect',
            defaultAccount: 'sub',
          },
        });
        const providerInstance = sdkInstance.getProvider();
        setProvider(providerInstance);
      } catch (e) {
        console.error('[DEBUG] ❌ Lazy init failed:', e);
        setError('Wallet provider not ready');
        return;
      }
    }

    if (isConnecting.current) {
      console.log('[DEBUG] ⏸️ Connection already in progress');
      return;
    }

    isConnecting.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log('[DEBUG] 📡 Requesting accounts from provider...');
      
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
        params: [],
      }) as Address[];

      console.log('[DEBUG] 📋 Accounts received:', accounts);

      if (!isMounted.current) {
        console.log('[DEBUG] Component unmounted, aborting connection');
        return;
      }

      // THIS IS THE NEW, CORRECTED REPLACEMENT CODE
      if (accounts.length > 1) {
        // With `defaultAccount: 'sub'`, the order is [Sub Account, Universal Account].
        const subAcc = accounts[0];
        const universalAcc = accounts[1];
        console.log('[DEBUG] 🎯 Sub Account (default) found:', subAcc);
        console.log('[DEBUG] 🎯 Universal Account (parent) found:', universalAcc);
        
        // Correctly assign the addresses to the state variables
        setSubAccountAddress(subAcc);
        setUniversalAddress(universalAcc);
        console.log('[DEBUG] ✓ State updated for both accounts.');
        
        setIsConnected(true);
        console.log('[DEBUG] ✓ isConnected set to true');
        
        setUsername(generateUsername());
        console.log('[DEBUG] ✓ Username generated');
        // Store connection state
        localStorage.setItem('walletConnected', 'true');
        console.log('[DEBUG] ✓ Connection state saved to localStorage');
        
        // Fetch balance for the now-correct Universal Address
        console.log('[DEBUG] 💵 Calling fetchBalance() after connection...');
        // We call fetchBalance directly here since the state update might not be immediate
        // for the useEffect that polls.
        if (universalAcc) {
            // Manually create a temporary fetcher to ensure we use the new address
            const fetcher = async () => {
                try {
                    const balanceData = `0x70a08231000000000000000000000000${universalAcc.substring(2)}`;
                    const balanceHex = await provider.request({
                        method: 'eth_call',
                        params: [{ to: USDC_CONTRACT_ADDRESS, data: balanceData }, 'latest'],
                    }) as string;
                    const balanceWei = BigInt(balanceHex);
                    const formattedBalance = (Number(balanceWei) / 1_000_000).toFixed(2);
                    setBalance(formattedBalance);
                    console.log('[DEBUG] ✅ Initial balance fetched successfully:', formattedBalance);
                } catch (e) {
                    console.error('Initial fetchBalance failed:', e);
                }
            };
            fetcher();
        }
      } else {
        // Fallback for unexpected account array structures
        console.error('[DEBUG] ❌ Expected at least 2 accounts but received:', accounts.length);
        if (accounts.length > 0) setUniversalAddress(accounts[0]); // Best guess
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      if (isMounted.current) {
        setError('Failed to connect wallet');
        // Clear localStorage on error to prevent auto-reconnect loops
        localStorage.removeItem('walletConnected');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
      isConnecting.current = false;
    }
  }, [provider, fetchBalance]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setUniversalAddress(null);
    setSubAccountAddress(null);
    setUsername('');
    setBalance(null);
    setError(null);
    localStorage.removeItem('walletConnected');
    console.log('[DEBUG] 🔌 Disconnected');
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
            version: '2.0',
            chainId: `0x${baseSepolia.id.toString(16)}`,
            from: subAccountAddress,
            calls: calls.map(call => ({
              to: call.to,
              data: call.data || '0x',
              value: call.value || '0x0',
            })),
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

  // Get calls status via provider (EIP-5792)
  const getCallsStatus = useCallback(async (id: string) => {
    if (!provider) throw new Error('Wallet provider not ready');
    return await provider.request({
      method: 'wallet_getCallsStatus',
      params: [{ id }],
    });
  }, [provider]);

  // Auto-connect on mount if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem('walletConnected');
    if (wasConnected === 'true' && provider && !isConnecting.current) {
      console.log('[DEBUG] 🔄 Auto-connecting...');
      connect();
    }
  }, [provider, connect]);

  // Poll balance every 10 seconds when connected
  useEffect(() => {
    console.log('[DEBUG] 🔄 Balance polling useEffect triggered');
    console.log('[DEBUG] isConnected:', isConnected, 'universalAddress:', universalAddress);
    
    if (!isConnected || !universalAddress) {
      console.log('[DEBUG] ⏸️ Not polling: wallet not connected');
      return;
    }

    console.log('[DEBUG] ▶️ Starting balance polling...');
    fetchBalance();

    const intervalId = setInterval(() => {
      console.log('[DEBUG] ⏰ Polling interval triggered');
      fetchBalance();
    }, 10000);

    return () => {
      console.log('[DEBUG] 🛑 Cleaning up balance polling');
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
        error,
        connect,
        disconnect,
        sendCalls,
        getCallsStatus,
        fetchBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
