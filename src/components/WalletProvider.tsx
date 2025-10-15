import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { createBaseAccountSDK } from '@base-org/account';
import { base } from 'viem/chains';
import type { Address } from 'viem';

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
          appChainIds: [base.id],
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
    if (!provider || !universalAddress) return;

    try {
      const balanceWei = await provider.request({
        method: 'eth_getBalance',
        params: [universalAddress, 'latest'],
      }) as string;
      const balanceEth = (parseInt(balanceWei, 16) / 1e18).toFixed(4);
      setBalance(balanceEth);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  }, [provider, universalAddress]);

  const connect = useCallback(async () => {
    if (!provider) {
      console.error('Provider not initialized');
      return;
    }

    setLoading(true);
    try {
      // Request account connection - this will trigger Sub Account creation
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
        params: [],
      }) as Address[];

      if (accounts.length > 0) {
        const universal = accounts[0];
        setUniversalAddress(universal);
        setIsConnected(true);
        setUsername(generateUsername());

        // Check for Sub Account (should be auto-created with 'on-connect' setting)
        try {
          const response = await provider.request({
            method: 'wallet_getSubAccounts',
            params: [
              {
                account: universal,
                domain: window.location.origin,
              },
            ],
          }) as { subAccounts: SubAccount[] };

          if (response.subAccounts && response.subAccounts.length > 0) {
            const subAcc = response.subAccounts[0];
            setSubAccountAddress(subAcc.address);
            console.log('Sub Account found:', subAcc.address);
          } else {
            // If no sub account exists, create one manually
            console.log('Creating Sub Account...');
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
            console.log('Sub Account created:', newSubAccount.address);
          }
        } catch (subAccountError) {
          console.error('Failed to get/create Sub Account:', subAccountError);
        }

        // Store connection state
        localStorage.setItem('walletConnected', 'true');
        
        // Fetch balance
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

  // Send calls using wallet_sendCalls (EIP-5792)
  // This will use the Sub Account by default with Auto Spend Permissions
  const sendCalls = useCallback(async (
    calls: Array<{ to: Address; data?: `0x${string}`; value?: string }>
  ): Promise<string> => {
    if (!provider || !subAccountAddress) {
      throw new Error('Wallet not connected or Sub Account not available');
    }

    try {
      // Send calls from Sub Account
      // The first transaction will prompt for Auto Spend Permission approval
      // Subsequent transactions will execute without prompts
      const callsId = await provider.request({
        method: 'wallet_sendCalls',
        params: [
          {
            version: '2.0',
            atomicRequired: true,
            chainId: `0x${base.id.toString(16)}`,
            from: subAccountAddress,
            calls: calls.map(call => ({
              to: call.to,
              data: call.data || '0x',
              value: call.value || '0x0',
            })),
            capabilities: {
              // Optional: Add paymaster URL for gas sponsorship
              // paymasterUrl: 'your-paymaster-url',
            },
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
