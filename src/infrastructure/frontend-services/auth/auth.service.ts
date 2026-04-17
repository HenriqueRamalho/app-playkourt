import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface SupabaseJWTPayload extends JWTPayload {
  email?: string;
  user_metadata?: { name?: string };
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');

// O JWKS é buscado uma vez por processo e mantido em cache pelo jose
// (TTL ~10min, cooldown 30s em caso de kid desconhecido). Evita o custo de
// bater no Supabase Auth em toda request autenticada.
const JWKS = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`));
const ISSUER = `${SUPABASE_URL}/auth/v1`;
const AUDIENCE = 'authenticated';

export class AuthService {
  static async getUserFromToken(token: string): Promise<AuthUser | null> {
    try {
      const { payload } = await jwtVerify<SupabaseJWTPayload>(token, JWKS, {
        issuer: ISSUER,
        audience: AUDIENCE,
      });
      if (!payload.sub || !payload.email) return null;
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.user_metadata?.name,
      };
    } catch {
      return null;
    }
  }
}
