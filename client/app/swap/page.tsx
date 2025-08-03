'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { useRouter } from 'next/navigation';
import { swapApi, SwapQuote, SwapPreview } from '@/lib/swap-api';
import Image from 'next/image';

// Token addresses for quick access
const TOKENS = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  USDC_ETH: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  USDC_POLYGON: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'
};

const CHAINS = {
  ETHEREUM: 1,
  POLYGON: 137
};
type ChainTokens = {
  [chainId: number]: string;
};

const CHAIN_TOKENS: ChainTokens = {
  1 :'Ethereum',
  137:'Polygon',
  56:'Binance',
  42161:'Arbitrum',
  43114:'Avalanche',
  8453:'Base',
  324:'ZkSync',
  100:'Gnosis',
  10:'Optimism',
  59144:'Linea',
  146:'Sonic',
  130:'Unichain'
}


function TokenSelector({ 
  label, 
  selectedToken, 
  selectedChain, 
  onTokenSelect,
  onChainSelect,
  userTokens 
}: {
  label: string;
  selectedToken: string;
  selectedChain: number;
  onTokenSelect: (token: string) => void;
  onChainSelect: (chain: number) => void;
  userTokens: any[];
}) {
  const uniqueChains = new Map();
  const { fetchTokenPrices, tokenPrices, loading: pricesLoading } = useWallet();
  const [localLoading, setLocalLoading] = useState(false);
  useEffect(() => {
    if (userTokens) {
      setLocalLoading(true);
      fetchTokenPrices(
        selectedChain,
        userTokens.map(t => t.address)
      ).finally(() => setLocalLoading(false));
    }
  }, [selectedChain]);
  
  if (!selectedChain) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <p className="text-gray-600">Select a chain to view tokens</p>
      </div>
    );
  }
  

  for (const token of userTokens) {
    if (!uniqueChains.has(token.chainName)) {
     uniqueChains.set(token.chainName, token);
    }
  }
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <label className="block text-sm font-medium text-gray-700 mb-3">{label}</label>
      
      {/* Chain Selection */}
      <div className="mb-3">
        <div className="flex gap-2">
          {Array.from(uniqueChains.entries()).map(([chainName, token], index) => (
            <button 
             key={index} 
             className={`px-3 py-1 rounded text-sm ${
              selectedChain === token.chainId 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
             onClick={()=>onChainSelect(token.chainId)}>
              {chainName}
            </button>
          ))}
        </div>
      </div>

      {/* Token Selection */}
      <div className="space-y-2">
        {userTokens
          .filter(token => token.chainId === selectedChain)
          .map((token) => (
            <button
              key={`${token.address}-${token.chainId}`}
              onClick={() => onTokenSelect(token.address)}
              className={`w-full p-3 rounded-lg text-left transition-colors ${
                selectedToken === token.address
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{token.symbol}</p>
                  <p className="text-sm text-gray-500">{token.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{token.balance}</p>
                  <div className='flex gap-1 items-center'>
                    <p className='text-sm text-gray-400'>$</p>
                  <p className='text-sm text-gray-400'>{tokenPrices[token.address]?.[token.address.toLowerCase()] ?  parseFloat(tokenPrices[token.address][token.address.toLowerCase()]) *parseFloat(token.balance): 'Loading...'}</p>
                  </div>
                  {/* <p className="text-sm text-gray-500">${token.usd_value || '0.00'}</p> */}
                </div>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}


function ToTokenSelector({
  selectedToken,
  onChainSelect,
  selectedChain,
  onTokenSelect,
}:{
  selectedToken: string;
  onChainSelect: (chain: number) => void;
  selectedChain:number;
  onTokenSelect: (token: string) => void;
}){
  type TokenDetails = {
  address: string;
  symbol: string;
  name: string;
  logoURI: string;
  decimals: number;
};
  const [fetchedChainTokens,setFetchedTokens] = useState<Record<string, TokenDetails> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const {fetchChainTokens} = useWallet();
 

  useEffect(() => {
    const fetchTokens = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchChainTokens(selectedChain);
        setFetchedTokens(res.tokens || {}); 
        console.log(res)
      } catch (err) {
        setError("Failed to fetch tokens. Please try again.");
        setFetchedTokens({}); 
      } finally {
        setLoading(false);
      }
    };
    fetchTokens();
  }, [selectedChain, fetchChainTokens]);
  return(
    <div className="bg-gray-50 rounded-lg p-4">
      <label className="block text-sm font-medium text-gray-700 mb-3">To</label>
      <div className='mb-3'>
        <div className='flex gap-2 flex-wrap'>
          {Object.entries(CHAIN_TOKENS).map(([chainId,name])=>{
            const chainIdNum = Number(chainId);
            return(
              <button
              key={chainId} 
              className={`px-3 py-1 rounded text-sm ${selectedChain == chainIdNum ? 'bg-blue-600 text-white':'bg-white text-gray-700 border border-gray-300'}`}
              onClick={()=>onChainSelect(chainIdNum)}>{name}</button>
            )
          })}
        </div>
      </div>
      <div className='space-y-2'>
        {loading && <div>Loading tokens...</div>}
        {error && <div style={{ color: "red" }}>{error}</div>}
        {(!fetchedChainTokens || Object.keys(fetchedChainTokens).length === 0) && <div>No tokens found for this chain.</div>}
        {Object.keys(fetchedChainTokens ?? {}).length !== 0 && (
          <div className='max-h-[30vh] overflow-y-auto flex gap-4 flex-col'>
            {Object.entries(fetchedChainTokens ?? {}).map(([address, token]) => (
              <button
               key={address}
               className={`w-full p-3 rounded-lg text-left transition-colors  ${selectedToken === token.address ? 'bg-blue-50 border-2 border-blue-500':'bg-white border border-gray-200 hover:border-gray-300'}`}
               onClick={() => onTokenSelect(token.address)}
              >
               <div className="flex gap-4 items-center">
                <img src={token.logoURI} alt='Token Image' className="w-8 h-8 rounded-full"/>
                <div className='flex flex-col'>
                 <p className="font-medium text-gray-900">{token.name}</p>
                 <p className="text-sm text-gray-500">{token.symbol}</p>
                </div>
               </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SwapPreviewCard({ preview }: { preview: SwapPreview }) {
  if (!preview.success || !preview.data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">{preview.message}</p>
      </div>
    );
  }

  const { quote, transactionPreview } = preview.data;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-3">Swap Preview</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">You pay:</span>
          <span className="font-medium">{transactionPreview.fromAmount} {quote.srcToken?.symbol}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">You receive:</span>
          {/* <span className="font-medium">{transactionPreview.toAmount} {quote.dstToken.symbol}</span> */}
          {quote.type ==='cross-chain'?(<span>{transactionPreview.toAmount} {quote?.toToken?.symbol}</span>):(<span>{transactionPreview.toAmount} {quote.dstToken?.symbol}</span>)}
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Gas Amount:</span>
          <span className="font-medium">{quote.gas}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Minimum received:</span>
          <span className="font-medium">{transactionPreview.minimumReceived} {quote.dstToken?.symbol}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Network fee:</span>
          <span className="font-medium">{transactionPreview.networkFee}</span>
        </div>

        {quote.type === 'cross-chain' && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
            🌉 Cross-chain swap via 1inch Fusion+
          </div>
        )}
      </div>
    </div>
  );
}

export default function SwapPage() {
  const { isAuthenticated, token,loadingAuth } = useAuth();
  const { wallet, loading: walletLoading } = useWallet();
  const router = useRouter();

  // State
  const [fromToken, setFromToken] = useState('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE');
  const [fromChain, setFromChain] = useState(1);
  const [toToken, setToToken] = useState('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
  const [toChain, setToChain] = useState(1);
  const [amount, setAmount] = useState('1.0');
  const [preview, setPreview] = useState<SwapPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !loadingAuth) {
      router.push('/login');
    }
  }, [isAuthenticated,router,loadingAuth]);

  if (loadingAuth) {
    return (
    <div className="flex flex-col justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className='font-bold text-2xl'>Loading...</p>
    </div>
    )
  }

  // Flatten user tokens for easy selection
  const userTokens = wallet?.chains.flatMap(chain => 
    chain.tokens.map(token => ({
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      balance: token.balance,
      usd_value: token.usd_value,
      chainId: chain.chain_id,
      chainName: chain.chain_name
    }))
  ) || [];
  

  const getSwapPreview = async () => {
    if (!token || !amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    try {
      // Convert amount to wei for the specific token
      const fromTokenData = userTokens.find(t => t.address === fromToken && t.chainId === fromChain);
      if (!fromTokenData) {
        console.error('From token not found');
        return;
      }

      // Simple wei conversion (assumes 18 decimals for ETH, 6 for USDC)
      const decimals = fromToken === TOKENS.ETH ? 18 : 6;
      const weiAmount = (parseFloat(amount) * (10 ** decimals)).toString();

      const swapData =  {
        fromChainId:fromChain,
        toChainId:toChain,
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: weiAmount,
      } 
      console.log(swapData,'dataaaaaaaaaaaaaaaaaaaa')


      const result = await swapApi.previewSwap(swapData, token);
      console.log(result,'resulttttttttttttt')
      setPreview(result);
    } catch (error) {
      console.error('Preview failed:', error);
      setPreview({
        success: false,
        message: 'Failed to get swap preview'
      });
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!preview?.success || !token) return;

    setExecuting(true);
    try {
      const fromTokenData = userTokens.find(t => t.address === fromToken && t.chainId === fromChain);
      if (!fromTokenData) return;

      const decimals = fromToken === TOKENS.ETH ? 18 : 6;
      const weiAmount = (parseFloat(amount) * (10 ** decimals)).toString();

      const swapData = fromChain === toChain ? {
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: weiAmount,
        chainId: fromChain,
        slippage: 1
      } : {
        fromTokenAddress: fromToken,
        fromChainId: fromChain,
        toTokenAddress: toToken,
        toChainId: toChain,
        amount: weiAmount,
        slippage: 1
      };

      const result = await swapApi.executeSwap(swapData, token);
      
      if (result.success) {
        alert('Swap executed successfully! 🎉');
        router.push('/wallet');
      } else {
        alert(`Swap failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Swap execution failed:', error);
      alert('Swap execution failed');
    } finally {
      setExecuting(false);
    }
  };

  if (!isAuthenticated) return null;

  if (walletLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Swap Tokens</h2>
          
          <div className="space-y-6">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                step="0.000001"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* From Token */}
            <TokenSelector
              label="From"
              selectedToken={fromToken}
              selectedChain={fromChain}
              onTokenSelect={setFromToken}
              onChainSelect={setFromChain}
              userTokens={userTokens}
            />

            {/* Swap Arrow */}
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-600">↓</span>
              </div>
            </div>

            {/* To Token */}
            <ToTokenSelector
             selectedToken={toToken}
             onTokenSelect={setToToken}
             selectedChain={toChain}
             onChainSelect={setToChain}/>

            {/* Preview Button */}
            <button
              onClick={getSwapPreview}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Getting quote...' : 'Get Quote'}
            </button>

            {/* Preview */}
            {preview && (
              <div className="space-y-4">
                <SwapPreviewCard preview={preview} />
                
                {preview.success && (
                  <button
                    onClick={executeSwap}
                    disabled={executing}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {executing ? 'Executing swap...' : 'Execute Swap'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}