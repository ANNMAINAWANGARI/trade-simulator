'use client';

import React, { useState } from 'react';
import { LoginForm } from '../../../components/auth/LoginForm';
import { RegisterForm } from '../../../components/auth/RegisterForm';

export default function AuthPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">🏦</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">DeFi Simulator</h1>
        <p className="text-lg text-gray-600">Learn DeFi trading with real market data, zero risk</p>
      </div>

      {/* Auth Forms */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {isLoginMode ? (
          <LoginForm onSwitchToRegister={() => setIsLoginMode(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLoginMode(true)} />
        )}
      </div>

      {/* Features */}
      <div className="mt-12 max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Real Market Data</h3>
            <p className="text-gray-600 text-sm">
              Trade with live prices from 1inch API across multiple chains
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">🎓</div>
            <h3 className="font-semibold text-gray-900 mb-2">Learn DeFi</h3>
            <p className="text-gray-600 text-sm">
              Practice trading, liquidity providing, and cross-chain swaps safely
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-semibold text-gray-900 mb-2">Zero Risk</h3>
            <p className="text-gray-600 text-sm">
              Virtual wallet system - learn without losing real money
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>Built for the Unite DeFi Hackathon 2025</p>
        <p className="mt-1">Powered by 1inch APIs</p>
      </div>
    </div>
  );
}