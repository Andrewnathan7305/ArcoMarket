import { useState, useCallback } from 'react';

interface ContractCallParams {
  method: string;
  params: any;
  privateKey?: string;
  marketAddress?: string;
}

interface ContractResult {
  success: boolean;
  result?: any;
  error?: string;
}

export const useContract = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const callFactory = useCallback(async (params: ContractCallParams): Promise<ContractResult> => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/contracts/factory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: params.method,
          params: params.params,
          privateKey: params.privateKey
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Contract call failed');
      }

      return { success: true, result: data.result };
    } catch (err: any) {
      const errorMsg = err.message || 'Factory contract call failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const callMarket = useCallback(async (params: ContractCallParams): Promise<ContractResult> => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/contracts/market', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: params.method,
          params: params.params,
          privateKey: params.privateKey,
          marketAddress: params.marketAddress
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Contract call failed');
      }

      return { success: true, result: data.result };
    } catch (err: any) {
      const errorMsg = err.message || 'Market contract call failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const callManager = useCallback(async (params: ContractCallParams): Promise<ContractResult> => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/contracts/manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: params.method,
          params: params.params,
          privateKey: params.privateKey
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Contract call failed');
      }

      return { success: true, result: data.result };
    } catch (err: any) {
      const errorMsg = err.message || 'Manager contract call failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    callFactory,
    callMarket,
    callManager,
    clearError: () => setError('')
  };
};

