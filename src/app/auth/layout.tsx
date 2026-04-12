'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {user && (
        <div className="mb-6 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-center gap-4">
          <span>Você está logado como <strong>{user.email}</strong>. Deseja fazer logout?</span>
          <button onClick={signOut} className="underline font-medium hover:text-yellow-900">
            Sair
          </button>
        </div>
      )}
      {children}
    </div>
  );
}
