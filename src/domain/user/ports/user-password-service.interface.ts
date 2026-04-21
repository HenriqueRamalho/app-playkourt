export interface ChangePasswordWithSessionInput {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions: boolean;
}

export interface SetInitialPasswordWithSessionInput {
  newPassword: string;
}

/** Cabeçalhos devolvidos pelo Better Auth (ex.: Set-Cookie ao revogar outras sessões). */
export interface UserPasswordServiceResult {
  responseHeaders: Headers | null;
}

/**
 * Operações de senha delegadas ao Better Auth (verificação de hash e persistência).
 * Implementação na infraestrutura.
 */
export interface UserPasswordServiceInterface {
  changePassword(
    input: ChangePasswordWithSessionInput,
    requestHeaders: Headers,
  ): Promise<UserPasswordServiceResult>;

  setInitialPassword(
    input: SetInitialPasswordWithSessionInput,
    requestHeaders: Headers,
  ): Promise<UserPasswordServiceResult>;
}
