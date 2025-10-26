import { useState, useEffect, useCallback } from 'react';
import { ethers, BrowserProvider, JsonRpcSigner } from 'ethers';

// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}

interface MetaMaskState {
  isConnected: boolean;
  account: string;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  chainId: string;
  balance: string;
}

export const useMetaMask = () => {
  const [state, setState] = useState<MetaMaskState>({
    isConnected: false,
    account: '',
    provider: null,
    signer: null,
    chainId: '',
    balance: '0'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';

  // Get account balance
  const getBalance = useCallback(async (provider: BrowserProvider, account: string) => {
    try {
      const balance = await provider.getBalance(account);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error('Error getting balance:', err);
      return '0';
    }
  }, []);

  // Get chain ID
  const getChainId = useCallback(async (provider: BrowserProvider) => {
    try {
      const network = await provider.getNetwork();
      return network.chainId.toString();
    } catch (err) {
      console.error('Error getting chain ID:', err);
      return '';
    }
  }, []);

  // Connect to MetaMask
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      setError('MetaMask not detected. Please install MetaMask.');
      return false;
    }

    setLoading(true);
    setError('');

    try {
      const provider = new BrowserProvider(window.ethereum!);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      
      const balance = await getBalance(provider, accounts[0]);
      const chainId = await getChainId(provider);

      setState({
        isConnected: true,
        account: accounts[0],
        provider,
        signer,
        chainId,
        balance
      });

      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to connect to MetaMask';
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isMetaMaskInstalled, getBalance, getChainId]);

  // Disconnect from MetaMask
  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      account: '',
      provider: null,
      signer: null,
      chainId: '',
      balance: '0'
    });
    setError('');
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (chainId: string) => {
    if (!isMetaMaskInstalled || !state.provider) return false;

    try {
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${parseInt(chainId).toString(16)}` }],
      });
      return true;
    } catch (err: any) {
      setError(`Failed to switch network: ${err.message}`);
      return false;
    }
  }, [isMetaMaskInstalled, state.provider]);

  // Refresh account info
  const refreshAccount = useCallback(async () => {
    if (!state.provider || !state.account) return;

    try {
      const balance = await getBalance(state.provider, state.account);
      const chainId = await getChainId(state.provider);
      
      setState(prev => ({
        ...prev,
        balance,
        chainId
      }));
    } catch (err) {
      console.error('Error refreshing account:', err);
    }
  }, [state.provider, state.account, getBalance, getChainId]);

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== state.account) {
        setState(prev => ({ ...prev, account: accounts[0] }));
        refreshAccount();
      }
    };

    const handleChainChanged = (chainId: string) => {
      setState(prev => ({ ...prev, chainId }));
      refreshAccount();
    };

    window.ethereum!.on('accountsChanged', handleAccountsChanged);
    window.ethereum!.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum!.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum!.removeListener('chainChanged', handleChainChanged);
    };
  }, [isMetaMaskInstalled, state.account, disconnect, refreshAccount]);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled) return;

      try {
        const provider = new BrowserProvider(window.ethereum!);
        const accounts = await provider.send("eth_accounts", []);
        
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const balance = await getBalance(provider, accounts[0]);
          const chainId = await getChainId(provider);

          setState({
            isConnected: true,
            account: accounts[0],
            provider,
            signer,
            chainId,
            balance
          });
        }
      } catch (err) {
        console.error('Error checking connection:', err);
      }
    };

    checkConnection();
  }, [isMetaMaskInstalled, getBalance, getChainId]);

  return {
    ...state,
    loading,
    error,
    isMetaMaskInstalled,
    connect,
    disconnect,
    switchNetwork,
    refreshAccount,
    clearError: () => setError('')
  };
};

