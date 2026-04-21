import { UserRepositoryInterface } from '@/domain/user/repository/user-repository.interface';
import type {
  UserPasswordServiceInterface,
  UserPasswordServiceResult,
} from '@/domain/user/ports/user-password-service.interface';

const MIN_LEN = 8;

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  revokeOtherSessions: boolean;
}

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly passwordService: UserPasswordServiceInterface,
  ) {}

  async execute(
    userId: string,
    input: ChangePasswordInput,
    requestHeaders: Headers,
  ): Promise<UserPasswordServiceResult> {
    const hasCredential = await this.userRepository.hasPasswordCredential(userId);
    if (!hasCredential) {
      throw new Error('Esta conta não possui senha local. Use a opção para definir uma senha.');
    }

    const { currentPassword, newPassword, confirmNewPassword, revokeOtherSessions } = input;

    if (!currentPassword.trim()) {
      throw new Error('Informe a senha atual.');
    }
    if (newPassword.length < MIN_LEN) {
      throw new Error(`A nova senha deve ter pelo menos ${MIN_LEN} caracteres.`);
    }
    if (newPassword !== confirmNewPassword) {
      throw new Error('A confirmação da nova senha não confere.');
    }
    if (newPassword === currentPassword) {
      throw new Error('A nova senha deve ser diferente da senha atual.');
    }

    return this.passwordService.changePassword(
      {
        currentPassword,
        newPassword,
        revokeOtherSessions,
      },
      requestHeaders,
    );
  }
}
