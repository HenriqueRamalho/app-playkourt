import { UserRepositoryInterface } from '@/domain/user/repository/user-repository.interface';
import type {
  UserPasswordServiceInterface,
  UserPasswordServiceResult,
} from '@/domain/user/ports/user-password-service.interface';

const MIN_LEN = 8;

export interface SetInitialPasswordInput {
  newPassword: string;
  confirmNewPassword: string;
}

export class SetInitialPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly passwordService: UserPasswordServiceInterface,
  ) {}

  async execute(
    userId: string,
    input: SetInitialPasswordInput,
    requestHeaders: Headers,
  ): Promise<UserPasswordServiceResult> {
    const hasCredential = await this.userRepository.hasPasswordCredential(userId);
    if (hasCredential) {
      throw new Error('Você já possui uma senha. Use a opção de alterar senha.');
    }

    const { newPassword, confirmNewPassword } = input;

    if (newPassword.length < MIN_LEN) {
      throw new Error(`A senha deve ter pelo menos ${MIN_LEN} caracteres.`);
    }
    if (newPassword !== confirmNewPassword) {
      throw new Error('A confirmação da senha não confere.');
    }

    return this.passwordService.setInitialPassword({ newPassword }, requestHeaders);
  }
}
