'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useWallet } from '../../hooks/useWallet';
import { WalletOverview } from '../../components/wallet/WalletOverview';

export default function DashboardPage() {
  const { user } = useAuth();
  const { fetchWallets, wallets, loading } = useWallet();

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.username}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Ready to practice some DeFi trading?
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Account Status</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">💼</div>
            <div>
              <p className="text-sm text-gray-500">Total Wallets</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : wallets.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm text-gray-500">Portfolio Value</p>
              <p className="text-2xl font-bold text-green-600">$10,000</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🔄</div>
            <div>
              <p className="text-sm text-gray-500">Total Trades</p>
              <p className="text-2xl font-bold text-blue-600">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📈</div>
            <div>
              <p className="text-sm text-gray-500">P&L Today</p>
              <p className="text-2xl font-bold text-gray-900">$0.00</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wallet Overview */}
        <div className="lg:col-span-2">
          <WalletOverview />
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition duration-200">
                <div className="flex items-center">
                  <span className="text-xl mr-3">🔄</span>
                  <div>
                    <p className="font-medium text-gray-900">Start Trading</p>
                    <p className="text-sm text-gray-500">Swap tokens with 1inch</p>
                  </div>
                </div>
              </button>

              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition duration-200">
                <div className="flex items-center">
                  <span className="text-xl mr-3">🌉</span>
                  <div>
                    <p className="font-medium text-gray-900">Cross-Chain Bridge</p>
                    <p className="text-sm text-gray-500">Move assets between chains</p>
                  </div>
                </div>
              </button>

              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition duration-200">
                <div className="flex items-center">
                  <span className="text-xl mr-3">📊</span>
                  <div>
                    <p className="font-medium text-gray-900">Limit Orders</p>
                    <p className="text-sm text-gray-500">Set advanced trading orders</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Learning Section */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Learning Hub</h3>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3">
                <p className="font-medium text-gray-900 text-sm">DeFi Basics</p>
                <p className="text-xs text-gray-500">Learn the fundamentals</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="font-medium text-gray-900 text-sm">Trading Strategies</p>
                <p className="text-xs text-gray-500">Advanced trading techniques</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="font-medium text-gray-900 text-sm">Risk Management</p>
                <p className="text-xs text-gray-500">Protect your capital</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}