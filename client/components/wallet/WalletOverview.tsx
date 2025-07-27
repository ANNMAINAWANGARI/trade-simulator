'use client';

import React, { useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { formatBalance, formatUSD } from '../../lib/utils';

export const WalletOverview: React.FC = () => {
  const {
    currentWallet,
    balances,
    portfolioSummary,
    loading,
    error,
    refreshCurrentWallet
  } = useWallet();

  useEffect(() => {
    if (currentWallet) {
      refreshCurrentWallet();
    }
  }, [currentWallet]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!currentWallet) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No wallet selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{currentWallet.name}</h2>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
            Chain {currentWallet.chain_id}
          </span>
        </div>
        
        <div className="text-sm text-gray-600 mb-2">Virtual Address:</div>
        <div className="font-mono text-sm bg-gray-50 p-2 rounded border break-all">
          {currentWallet.address}
        </div>
        
        {portfolioSummary && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Portfolio Value:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatUSD(portfolioSummary.totalValue)}
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {portfolioSummary.transactionCount} transactions
            </div>
          </div>
        )}
      </div>

      {/* Token Balances */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Token Balances</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {balances.length > 0 ? (
            balances.map((balance) => (
              <div key={balance.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-800 font-semibold text-sm">
                      {balance.token_symbol.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{balance.token_symbol}</div>
                    <div className="text-sm text-gray-500">{balance.token_name}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatBalance(balance.balance, balance.token_decimals)} {balance.token_symbol}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatUSD(balance.usd_value)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              No tokens found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};