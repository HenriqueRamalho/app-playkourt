import { auth } from '@/infrastructure/auth/better-auth.server';
import type {
  ChangePasswordWithSessionInput,
  SetInitialPasswordWithSessionInput,
  UserPasswordServiceInterface,
  UserPasswordServiceResult,
} from '@/domain/user/ports/user-password-service.interface';
import { isAPIError } from 'better-auth/api';

const MIN_PASSWORD_LENGTH = 8;

type AuthCallWithHeaders = {
  headers?: Headers | null;
  response: unknown;
};

function mapAuthPasswordError(err: unknown): string {
  if (isAPIError(err)) {
    const code = err.body && typeof err.body === 'object' && 'code' in err.body ? String(err.body.code) : '';
    const fallback = err.body && typeof err.body === 'object' && 'message' in err.body ? String(err.body.message) : err.message;

    if (code === 'INVALID_PASSWORD' || fallback.toLowerCase().includes('invalid password')) {
      return 'Senha atual incorreta.';
    }
    if (code === 'PASSWORD_TOO_SHORT') {
      return `A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    if (code === 'PASSWORD_TOO_LONG') {
      return 'A nova senha é longa demais.';
    }
    if (code === 'CREDENTIAL_ACCOUNT_NOT_FOUND') {
      return 'Esta conta não possui senha local. Use a opção de definir senha.';
    }
    if (code === 'PASSWORD_ALREADY_SET') {
      return 'Você já possui uma senha. Use a opção de alterar senha.';
    }
    return fallback || 'Não foi possível atualizar a senha.';
  }
  if (err instanceof Error) return err.message;
  return 'Não foi possível atualizar a senha.';
}

export class BetterAuthUserPasswordService implements UserPasswordServiceInterface {
  async changePassword(
    input: ChangePasswordWithSessionInput,
    requestHeaders: Headers,
  ): Promise<UserPasswordServiceResult> {
    try {
      const out = (await auth.api.changePassword({
        body: {
          currentPassword: input.currentPassword,
          newPassword: input.newPassword,
          revokeOtherSessions: input.revokeOtherSessions,
        },
        headers: requestHeaders,
        returnHeaders: true,
      })) as AuthCallWithHeaders;

      return { responseHeaders: out.headers ?? null };
    } catch (e) {
      throw new Error(mapAuthPasswordError(e));
    }
  }

  async setInitialPassword(
    input: SetInitialPasswordWithSessionInput,
    requestHeaders: Headers,
  ): Promise<UserPasswordServiceResult> {
    try {
      const out = (await auth.api.setPassword({
        body: { newPassword: input.newPassword },
        headers: requestHeaders,
        returnHeaders: true,
      })) as AuthCallWithHeaders;

      return { responseHeaders: out.headers ?? null };
    } catch (e) {
      throw new Error(mapAuthPasswordError(e));
    }
  }
}
