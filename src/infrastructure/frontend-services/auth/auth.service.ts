import { supabase } from '@/infrastructure/database/supabase/server/client';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export class AuthService {
  static async getUserFromToken(token: string): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return null;
      return { id: user.id, email: user.email!, name: user.user_metadata?.name };
    } catch {
      return null;
    }
  }
}
