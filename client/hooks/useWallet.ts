'use client'

import { apiClient } from '@/lib/api';
import { PortfolioSummary, VirtualTransaction, VirtualWallet, WalletBalance } from '@/types/wallet';
import { useState, useEffect, useCallback } from 'react';

export const useWallet = () => {
  const [wallets, setWallets] = useState<VirtualWallet[]>([]);
  const [currentWallet, setCurrentWallet] = useState<VirtualWallet | null>(null);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [transactions, setTransactions] = useState<VirtualTransaction[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


    // Fetch user's wallets
  const fetchWallets = useCallback(async () => {
      try {
       setLoading(true);
       const response = await apiClient.get('/wallet');
       setWallets(response.data.data);
  
       if (response.data.data.length > 0 && !currentWallet) {
        setCurrentWallet(response.data.data[0]);
       }
      } catch (err) {
        setError('Failed to fetch wallets');
        console.error(err);
      } finally {
        setLoading(false);
      }
  }, [currentWallet]); // Only include necessary deps


  // Create new wallet
  const createWallet = async (name: string = 'Main Wallet', chainId: number = 1) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/wallet', { name, chainId });
      const newWallet = response.data.data;
      
      setWallets(prev => [newWallet, ...prev]);
      setCurrentWallet(newWallet);
      
      return newWallet;
    } catch (err) {
      setError('Failed to create wallet');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch wallet balances
  const fetchBalances = async (walletId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/wallet/${walletId}/balances`);
      setBalances(response.data.data.balances);
      return response.data.data;
    } catch (err) {
      setError('Failed to fetch balances');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transaction history
  const fetchTransactions = async (walletId: string, limit: number = 50, offset: number = 0) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/wallet/${walletId}/transactions?limit=${limit}&offset=${offset}`);
      setTransactions(response.data.data);
      return response.data.data;
    } catch (err) {
      setError('Failed to fetch transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch portfolio summary
  const fetchPortfolioSummary = async (walletId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/wallet/${walletId}/summary`);
      setPortfolioSummary(response.data.data);
      return response.data.data;
    } catch (err) {
      setError('Failed to fetch portfolio summary');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Validate balance for trade
  const validateBalance = async (walletId: string, tokenAddress: string, amount: string) => {
    try {
      const response = await apiClient.post(`/wallet/${walletId}/validate-balance`, {
        tokenAddress,
        amount
      });
      return response.data.data.isValid;
    } catch (err) {
      console.error('Failed to validate balance:', err);
      return false;
    }
  };

  // Switch current wallet
  const switchWallet = (wallet: VirtualWallet) => {
    setCurrentWallet(wallet);
    // Clear previous data
    setBalances([]);
    setTransactions([]);
    setPortfolioSummary(null);
  };

  // Refresh current wallet data
  const refreshCurrentWallet = async () => {
    if (currentWallet) {
      await Promise.all([
        fetchBalances(currentWallet.id),
        fetchTransactions(currentWallet.id),
        fetchPortfolioSummary(currentWallet.id)
      ]);
    }
  };

  return {
    // State
    wallets,
    currentWallet,
    balances,
    transactions,
    portfolioSummary,
    loading,
    error,
    
    // Actions
    fetchWallets,
    createWallet,
    fetchBalances,
    fetchTransactions,
    fetchPortfolioSummary,
    validateBalance,
    switchWallet,
    refreshCurrentWallet,
    
    // Utilities
    clearError: () => setError(null)
  };
};
