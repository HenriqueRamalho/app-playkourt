import { NextRequest } from 'next/server';
import { auth } from '@/infrastructure/auth/better-auth.server';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export class AuthService {
  static async getUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
  }
}
