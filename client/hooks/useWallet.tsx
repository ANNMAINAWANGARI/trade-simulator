'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api, WalletResponse } from '@/lib/api';

export function useWallet() {
  const { token, isAuthenticated } = useAuth();
  const [wallet, setWallet] = useState<WalletResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenPrices, setTokenPrices] = useState<Record<string, string>>({});

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
  
   const fetchTokenPrices = useCallback(async (chainId: number, tokenAddresses: string[]) => {
    if (!token || !isAuthenticated) return;

    try {
      setLoading(true);
       console.log('Fetching prices for:', chainId, tokenAddresses);
      const responses = await Promise.all(
        tokenAddresses.map(address => 
          api.getTokenPrice(chainId, address,token)
      ));
      console.log('Price responses:', responses);

      const newPrices = responses.reduce((acc, response, index) => {
        if (response.success && response.data) {
          const address = tokenAddresses[index];
          const normalizedAddress = address.toLowerCase();
          //acc[normalizedAddress] = response.data.price;
          console.log('yeeeeeeeeeeee',response.data[normalizedAddress],response.data.price)
          acc[address] = response.data.price;
        }
        return acc;
      }, {} as Record<string, string>);

      console.log('New prices:', newPrices);
      //setTokenPrices(prev => ({ ...prev, ...newPrices }));
      setTokenPrices(newPrices);
    } catch (err) {
      console.error('Error fetching token prices:', err);
      setError('Failed to fetch some token prices');
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated]);

  // Existing single price fetch function
  const tokenUsdPrice = async (chain_id: number, tokenAdd: string) => {
    if (!token || !isAuthenticated) return;

    try {
      setLoading(true);
      const response = await api.getTokenPrice(chain_id, tokenAdd,token);
      if (response.success && response.data) {
        const price = response.data.price; 
      setTokenPrices(prev => ({ ...prev, [tokenAdd]: price }));
      return price;
      }
      return '0';
    } catch (err) {
      setError('cannot fetch usd price for the token');
      return '0';
    } finally {
      setLoading(false);
    }
  };

  const fetchChainTokens = useCallback(async(chainId:number)=>{
    if (!token || !isAuthenticated) return;
    try{
      setLoading(true)
      const response = await api.getChainTokens(chainId,token);
      return response.data;
    }catch(err){
      setError('cannot fetch usd price for the token');
      return '0';
    }finally{
      setLoading(false);
    }
  },[token,isAuthenticated])

  useEffect(() => {
    fetchWallet();
  }, [token, isAuthenticated]);

  return { wallet, loading, error, refetch: fetchWallet,usdTokenPrice: tokenUsdPrice,fetchTokenPrices,tokenPrices,fetchChainTokens };
}