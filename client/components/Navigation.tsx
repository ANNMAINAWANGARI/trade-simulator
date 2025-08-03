'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export function Navigation() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/wallet" className="text-xl font-bold text-gray-900">
          DeFi Simulator
        </Link>
        
        <div className="flex items-center space-x-4 ">
          <Link 
            href="/wallet" 
            className="text-blue-600 font-bold text-md hover:text-blue-900 px-3 py-2 rounded-md hover:underline underline-offset-3"
          >
            Wallet
          </Link>
          <Link 
            href="/swap" 
            className="text-blue-600 font-bold text-md hover:text-blue-900 px-3 py-2 rounded-md hover:underline underline-offset-3"
          >
            Swap
          </Link>
          <button
            onClick={handleLogout}
            className="text-white font-bold text-md hover:text-blue-900 px-3 py-2 rounded-md hover:underline underline-offset-3 border border-blue-400 bg-blue-600"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}