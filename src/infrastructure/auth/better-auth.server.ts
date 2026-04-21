import { eq } from 'drizzle-orm';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError, getIp } from 'better-auth/api';
import { nextCookies } from 'better-auth/next-js';
import { getDb } from '@/infrastructure/database/drizzle/client';
import { user, session, account, verification } from '@/infrastructure/database/drizzle/schema/auth';
import { getEmailSender } from '@/infrastructure/services/email/email-container';
import {
  renderEmailVerificationEmail,
  renderPasswordResetEmail,
} from '@/infrastructure/services/email/react-email/render-auth-emails';

const COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN;

const BANNED_USER_MESSAGE =
  'Não foi possível entrar. Se você acredita que isso é um erro, contate o suporte.';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),

  emailVerification: {
    sendVerificationEmail: async ({ user: targetUser, url }) => {
      try {
        const { html, text } = await renderEmailVerificationEmail({
          userName: targetUser.name ?? targetUser.email,
          verificationUrl: url,
        });
        void getEmailSender().sendEmail({
          to: targetUser.email,
          recipientUserId: targetUser.id,
          subject: 'Confirme seu email — Playkourt',
          html,
          text,
          metadata: { userId: targetUser.id },
          templateName: 'auth/email-verification',
        });
      } catch {
        // Falha silenciosa: Better Auth continua mesmo se o envio falhar.
        // O usuário pode reenviar o link na tela de login.
      }
    },
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24, // 24 horas
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user: targetUser, url }, request) => {
      try {
        const { html, text } = await renderPasswordResetEmail({
          userName: targetUser.name ?? targetUser.email,
          resetUrl: url,
        });
        const requestIp = request ? getIp(request, { advanced: {} }) : null;
        void getEmailSender().sendEmail({
          to: targetUser.email,
          recipientUserId: targetUser.id,
          subject: 'Redefinir sua senha — Playkourt',
          html,
          text,
          metadata: {
            userId: targetUser.id,
            ...(requestIp ? { requestIp } : {}),
          },
          templateName: 'auth/password-reset',
        });
      } catch {
        // Falha silenciosa: fluxo HTTP segue; usuário pode solicitar novo link.
      }
    },
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
    // AUTH_COOKIE_DOMAIN (ex.: ".playkourt.com"): habilita cookie entre subdomínios
    // quando/quando o deploy usar hosts irmãos; com um único domínio e rotas /admin,
    // /go, /backoffice não é obrigatório. Em dev (localhost) normalmente fica vazio.
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

  databaseHooks: {
    session: {
      create: {
        before: async (sessionData) => {
          const userId = sessionData.userId;
          if (!userId) return;
          const [row] = await getDb()
            .select({ banned: user.banned })
            .from(user)
            .where(eq(user.id, userId))
            .limit(1);
          if (row?.banned) {
            throw new APIError('FORBIDDEN', {
              message: BANNED_USER_MESSAGE,
              code: 'USER_BANNED',
            });
          }
        },
      },
    },
  },

  plugins: [nextCookies()],
});

export type Auth = typeof auth;
