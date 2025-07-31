'use client';

import Link from 'next/link';

export default function HomePage() {
  
  return (
    <div className="min-h-screen">
      <h1 className='font-bold text-5xl w-full text-center pt-5'>Defi Simulator</h1>
      <div className="text-center">
        <div className='flex gap-4 items-center justify-center'>
          <Link href={'/register'} className='border px-2 rounded-sm'>Register</Link>
          <Link href={'/login'} className='border px-2 rounded-sm'>Login</Link>
        </div>
      </div>
    </div>
  );
}
