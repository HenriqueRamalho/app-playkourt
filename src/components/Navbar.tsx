'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, loading, signOut } = useAuth();

  return (
    <nav className="w-full bg-green-900 px-6 py-3 flex items-center justify-between shadow-sm">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-xl"></span>
        <span className="font-bold text-white tracking-tight text-lg">Playkourt</span>
      </Link>

      <div className="flex items-center gap-4 text-sm">
        {loading ? null : user ? (
          <>
            <Link href="/admin" className="text-green-100 hover:text-white transition-colors">Admin</Link>
            <Link href="/backoffice" className="text-green-100 hover:text-white transition-colors">Backoffice</Link>
            <span className="text-green-300 hidden sm:inline">{user.email}</span>
            <button
              onClick={signOut}
              className="text-sm text-white border border-green-500 rounded-lg px-3 py-1.5 hover:bg-green-600 transition-colors"
            >
              Sair
            </button>
          </>
        ) : (
          <>
            <Link href="/auth/login" className="text-green-100 hover:text-white transition-colors">Entrar</Link>
            <Link href="/auth/register" className="rounded-lg bg-white text-green-700 font-medium px-3 py-1.5 hover:bg-green-50 transition-colors">
              Criar conta
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
