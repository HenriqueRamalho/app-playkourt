'use client';

import { createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { authClient, useSession } from '@/infrastructure/auth/better-auth.client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useSession();
  const router = useRouter();

  const user: AuthUser | null = data?.user
    ? {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        image: data.user.image,
      }
    : null;

  const signOut = async () => {
    await authClient.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, loading: isPending, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
