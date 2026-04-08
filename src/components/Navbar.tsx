'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, loading, signOut } = useAuth();


  return (
    <nav className="w-full border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
      <Link href="/" className="font-semibold text-gray-900">Playkourt</Link>

      <div className="flex items-center gap-4 text-sm">
        {loading ? null : user ? (
          <>
            <span className="text-gray-600">{user.email}</span>
            <button onClick={signOut} className="text-blue-600 hover:text-blue-500">Sign out</button>
          </>
        ) : (
          <>
            <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">Sign in</Link>
            <Link href="/auth/register" className="rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
