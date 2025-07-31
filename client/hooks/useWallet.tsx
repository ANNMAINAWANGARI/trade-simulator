'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api, WalletResponse } from '@/lib/api';

export function useWallet() {
  const { token, isAuthenticated } = useAuth();
  const [wallet, setWallet] = useState<WalletResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = async () => {
    if (!token || !isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.getWallet(token);
      
      if (response.success && response.data) {
        setWallet(response.data);
        setError(null);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [token, isAuthenticated]);

  return { wallet, loading, error, refetch: fetchWallet };
}