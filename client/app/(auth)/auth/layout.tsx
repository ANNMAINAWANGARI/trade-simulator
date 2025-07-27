'use client';

import { AuthProvider } from '@/hooks/useAuth';
import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="auth-layout">
        {children}
      </div>
    </AuthProvider>
  );
}