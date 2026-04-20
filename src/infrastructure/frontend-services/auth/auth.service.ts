import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { auth } from '@/infrastructure/auth/better-auth.server';
import { getDb } from '@/infrastructure/database/drizzle/client';
import { user } from '@/infrastructure/database/drizzle/schema/auth';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export class AuthService {
  static async getUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) return null;

    const [row] = await getDb()
      .select({ banned: user.banned })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);
    if (!row || row.banned) return null;

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
  }
}
