'use client';

import React from 'react';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { UserMenu } from '../../components/auth/UserMenu';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🏦</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">DeFi Simulator</h1>
                  <p className="text-xs text-gray-500">Learn • Trade • Earn</p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="hidden md:flex space-x-8">
                <a href="/dashboard" className="text-gray-600 hover:text-gray-900 transition duration-200">
                  Dashboard
                </a>
                <a href="/portfolio" className="text-gray-600 hover:text-gray-900 transition duration-200">
                  Portfolio
                </a>
                <a href="/trading" className="text-gray-600 hover:text-gray-900 transition duration-200">
                  Trading
                </a>
                <a href="/history" className="text-gray-600 hover:text-gray-900 transition duration-200">
                  History
                </a>
              </nav>

              {/* User Menu */}
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}