import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { getDb } from '@/infrastructure/database/drizzle/client';
import { user, session, account, verification } from '@/infrastructure/database/drizzle/schema/auth';

const COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },

  socialProviders: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : undefined,

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
    // Em produção, o cookie é compartilhado entre admin./go./backoffice.<domain>
    // via AUTH_COOKIE_DOMAIN=".domain.com". Em dev (localhost) ficamos sem.
    ...(COOKIE_DOMAIN
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: COOKIE_DOMAIN,
          },
          defaultCookieAttributes: {
            sameSite: 'lax' as const,
            secure: true,
          },
        }
      : {}),
  },

  plugins: [nextCookies()],
});

export type Auth = typeof auth;
