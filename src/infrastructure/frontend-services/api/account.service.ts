export interface AccountSecurityStatus {
  hasPasswordCredential: boolean;
}

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

  async getSecurityStatus(): Promise<AccountSecurityStatus> {
    const res = await fetch('/api/accounts/security');
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: null }));
      throw new Error(error ?? 'Failed to load security status');
    }
    return res.json();
  },

  async changePassword(input: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    revokeOtherSessions: boolean;
  }): Promise<void> {
    const res = await fetch('/api/accounts/security/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: null }));
      throw new Error(error ?? 'Failed to change password');
    }
  },

  async setInitialPassword(input: { newPassword: string; confirmNewPassword: string }): Promise<void> {
    const res = await fetch('/api/accounts/security/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: null }));
      throw new Error(error ?? 'Failed to set password');
    }
  },
};
