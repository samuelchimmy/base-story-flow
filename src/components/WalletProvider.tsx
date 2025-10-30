import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { createBaseAccountSDK } from '@base-org/account';
import { base } from 'viem/chains'; 
import type { Address } from 'viem';

const USDC_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
const PAYMASTER_URL = 'https://api.developer.coinbase.com/rpc/v1/base/K0w5Uf93K5TJP4TSF3oMr9BAtJCqJ48f';

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
  provider: any | null;
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
          appChainIds: [base.id], 
          subAccounts: {
            creation: 'on-connect',
            defaultAccount: 'sub',
          },
          paymasterUrls: PAYMASTER_URL ? { [base.id]: PAYMASTER_URL } : undefined,
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

  // Stable fetchBalance using useCallback - always fetches latest balance
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
      
      // Force state update by using functional form
      setBalance((prevBalance) => {
        console.log('[DEBUG] 🔄 Updating balance from', prevBalance, 'to', formattedBalance);
        return formattedBalance;
      });
    } catch (error) {
      console.error('❌ Failed to fetch USDC balance:', error);
      setBalance('0.00');
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
          appChainIds: [base.id],
          subAccounts: {
            creation: 'on-connect',
            defaultAccount: 'sub',
          },
          paymasterUrls: PAYMASTER_URL ? { [base.id]: PAYMASTER_URL } : undefined,
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

      // Extract universal address
      const universalAcc = accounts[0];
      console.log('[DEBUG] 🎯 Universal Account:', universalAcc);
      
      // Explicitly create/attach sub account for this session
      console.log('[DEBUG] 🔧 Creating/attaching Sub Account...');
      try {
        await provider.request({
          method: 'wallet_addSubAccount',
          params: [{ account: { type: 'create' } }],
        });
        console.log('[DEBUG] ✅ Sub Account attached');
      } catch (subErr) {
        console.warn('[DEBUG] ⚠️ Sub Account attach failed (may already exist):', subErr);
      }

      // Resolve sub account address directly
      console.log('[DEBUG] 🔍 Resolving Sub Account address...');
      let subAcc: Address | null = null;
      try {
        const { subAccounts } = await provider.request({
          method: 'wallet_getSubAccounts',
          params: [{ 
            account: universalAcc, 
            domain: window.location.origin 
          }],
        }) as { subAccounts: SubAccount[] };
        
        subAcc = subAccounts?.[0]?.address || null;
        console.log('[DEBUG] 🎯 Sub Account resolved:', subAcc);
      } catch (getSubErr) {
        console.error('[DEBUG] ❌ Failed to resolve Sub Account:', getSubErr);
        setError('Failed to create app account. Please refresh and try again.');
        return;
      }

      if (!subAcc) {
        console.error('[DEBUG] ❌ No Sub Account available');
        setError('Could not create app account. Please refresh and reconnect.');
        return;
      }

      // Set addresses
      setUniversalAddress(universalAcc);
      setSubAccountAddress(subAcc);
      console.log('[DEBUG] ✓ Both accounts set - Universal:', universalAcc, 'Sub:', subAcc);
      
      setIsConnected(true);
      setUsername(generateUsername());
      localStorage.setItem('walletConnected', 'true');
      
      // Fetch initial balance
      console.log('[DEBUG] 💵 Fetching initial balance...');
      try {
        const balanceData = `0x70a08231000000000000000000000000${universalAcc.substring(2)}`;
        const balanceHex = await provider.request({
          method: 'eth_call',
          params: [{ to: USDC_CONTRACT_ADDRESS, data: balanceData }, 'latest'],
        }) as string;
        const balanceWei = BigInt(balanceHex);
        const formattedBalance = (Number(balanceWei) / 1_000_000).toFixed(2);
        setBalance(formattedBalance);
        console.log('[DEBUG] ✅ Initial balance:', formattedBalance, 'USDC');
      } catch (balErr) {
        console.error('[DEBUG] ❌ Balance fetch failed:', balErr);
        setBalance('0.00');
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
    if (!provider) {
      throw new Error('Wallet provider not ready');
    }
    if (!subAccountAddress) {
      throw new Error('Wallet not connected');
    }

    console.log('[sendCalls] 🚀 Starting transaction from Sub Account:', subAccountAddress);
    console.log('[sendCalls] 📝 Calls:', calls);

    // Resolve chainId dynamically
    let chainIdHex = '0x2105'; // Base mainnet default
    try {
      const cid = (await provider.request({
        method: 'eth_chainId',
        params: [],
      })) as string;
      if (typeof cid === 'string' && cid.startsWith('0x')) {
        chainIdHex = cid;
      }
      console.log('[sendCalls] 🔗 Chain ID:', chainIdHex);
    } catch (err) {
      console.warn('[sendCalls] ⚠️ eth_chainId failed, using default:', chainIdHex);
    }

    // Build transaction params with paymaster
    const params = {
      version: '2.0' as const,
      atomicRequired: true,
      chainId: chainIdHex,
      from: subAccountAddress, // Always send from Sub Account
      calls: calls.map((call) => ({
        to: call.to,
        data: call.data || '0x',
        value: call.value || '0x0',
      })),
      capabilities: PAYMASTER_URL ? { 
        paymasterService: { 
          url: PAYMASTER_URL 
        } 
      } : undefined,
    };

    console.log('[sendCalls] 📦 Transaction params:', JSON.stringify(params, null, 2));

    try {
      // Send transaction from Sub Account with paymaster
      // This will automatically trigger Spend Permissions if needed
      const callsId = (await provider.request({
        method: 'wallet_sendCalls',
        params: [params],
      })) as string;

      console.log('[sendCalls] ✅ Transaction sent successfully! Calls ID:', callsId);
      console.log('[sendCalls] 💡 Auto Spend Permissions: If this was your first transaction, you should have seen a popup to approve spending from your Base Account.');
      
      return callsId;
    } catch (error: any) {
      console.error('[sendCalls] ❌ Transaction failed:', error);
      
      // Provide helpful error messages
      if (error?.message?.includes('User rejected')) {
        throw new Error('Transaction cancelled by user');
      } else if (error?.message?.includes('insufficient')) {
        throw new Error('Insufficient balance. Please add funds to your Base Account.');
      } else if (error?.message?.includes('paymaster')) {
        throw new Error('Gas sponsorship failed. Please try again.');
      }
      
      throw error;
    }
  }, [provider, subAccountAddress]);

  // FIXED: Get calls status via provider (EIP-5792)
  // Pass the id string directly, not wrapped in an object
  const getCallsStatus = useCallback(async (id: string) => {
    if (!provider) throw new Error('Wallet provider not ready');
    
    console.log('[DEBUG] 📞 Calling wallet_getCallsStatus with ID:', id);
    
    return await provider.request({
      method: 'wallet_getCallsStatus',
      params: [id], // ✅ FIXED: Pass string directly, not { id }
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
        provider,
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
