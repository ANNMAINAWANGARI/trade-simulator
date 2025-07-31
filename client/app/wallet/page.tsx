'use client';

import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function WalletHeader({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">DeFi Wallet</h1>
        <button
          onClick={onLogout}
          className="text-gray-600 hover:text-gray-800 text-sm"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function WalletSummary({ wallet }: { wallet: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{wallet.total_chains}</p>
          <p className="text-sm text-gray-600">Chains</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{wallet.total_tokens}</p>
          <p className="text-sm text-gray-600">Tokens</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">${wallet.total_usd_value}</p>
          <p className="text-sm text-gray-600">Total Value</p>
        </div>
      </div>
    </div>
  );
}

function ChainSelector({ 
  chains, 
  selectedChain, 
  onChainSelect 
}: { 
  chains: any[];
  selectedChain: number | null;
  onChainSelect: (chainId: number) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Select Chain</h3>
      <div className="flex flex-wrap gap-2">
        {chains.map((chain) => (
          <button
            key={chain.chain_id}
            onClick={() => onChainSelect(chain.chain_id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedChain === chain.chain_id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {chain.chain_name} ({chain.token_count})
          </button>
        ))}
      </div>
    </div>
  );
}

function TokenList({ chain }: { chain: any }) {
  if (!chain) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <p className="text-gray-600">Select a chain to view tokens</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {chain.chain_name} Tokens
        </h3>
        <p className="text-sm text-gray-600">
          Total value: ${chain.total_usd_value}
        </p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {chain.tokens.map((token: any, index: number) => (
          <div key={`${token.address}-${index}`} className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {token.logo_uri && (
                <img
                  src={token.logo_uri}
                  alt={token.symbol}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{token.symbol}</p>
                <p className="text-xs text-gray-500">{token.name}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{token.balance}</p>
              <p className="text-xs text-gray-500">${token.usd_value || '0.00'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const { wallet, loading, error } = useWallet();
  const router = useRouter();
  const [selectedChain, setSelectedChain] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (wallet?.chains && wallet.chains.length > 0 && !selectedChain) {
      setSelectedChain(wallet.chains[0].chain_id);
    }
  }, [wallet, selectedChain]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <WalletHeader onLogout={handleLogout} />
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading wallet...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <WalletHeader onLogout={handleLogout} />
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="min-h-screen bg-gray-50">
        <WalletHeader onLogout={handleLogout} />
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-gray-600">No wallet data found</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedChainData = wallet.chains.find(chain => chain.chain_id === selectedChain);

  return (
    <div className="min-h-screen bg-gray-50">
      <WalletHeader onLogout={handleLogout} />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome back, {user?.email}
          </h2>
          <p className="text-gray-600">Manage your DeFi portfolio</p>
        </div>

        <WalletSummary wallet={wallet} />
        
        <ChainSelector
          chains={wallet.chains}
          selectedChain={selectedChain}
          onChainSelect={setSelectedChain}
        />
        
        <TokenList chain={selectedChainData} />
      </div>
    </div>
  );
}