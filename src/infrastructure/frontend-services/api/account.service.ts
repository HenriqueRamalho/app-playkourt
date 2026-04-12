import { supabase } from '@/infrastructure/frontend-services/supabase';

async function getAuthHeader(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return `Bearer ${session.access_token}`;
}

export const accountService = {
  async updateProfile(name: string): Promise<{ id: string; email: string; name: string }> {
    const authorization = await getAuthHeader();
    const res = await fetch('/api/accounts/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to update profile');
    }
    await supabase.auth.refreshSession();
    return res.json();
  },
};
