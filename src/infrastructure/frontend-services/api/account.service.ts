export const accountService = {
  async updateProfile(name: string): Promise<{ id: string; email: string; name: string }> {
    const res = await fetch('/api/accounts/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: null }));
      throw new Error(error ?? 'Failed to update profile');
    }
    return res.json();
  },
};
