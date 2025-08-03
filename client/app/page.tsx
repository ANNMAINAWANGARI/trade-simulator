'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/wallet');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            DeFi Simulator
          </h1>
          <p className="text-gray-600 mb-8">
            Trade tokens with real 1inch pricing. No risk, all the learning.
          </p>
          
          <div className="space-y-4">
            <Link
              href="/register"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
            >
              Get Started
            </Link>
            
            <Link
              href="/login"
              className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 font-medium"
            >
              Sign In
            </Link>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">What you get:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Virtual wallet with real tokens</li>
              <li>• Real-time pricing from 1inch</li>
              <li>• Cross-chain swaps</li>
              <li>• No gas fees, instant execution</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
