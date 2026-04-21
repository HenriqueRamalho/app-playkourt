import { UserRepositoryInterface } from '@/domain/user/repository/user-repository.interface';

export interface AccountSecurityStatus {
  hasPasswordCredential: boolean;
}

export class GetAccountSecurityStatusUseCase {
  constructor(private readonly userRepository: UserRepositoryInterface) {}

  async execute(userId: string): Promise<AccountSecurityStatus> {
    const hasPasswordCredential = await this.userRepository.hasPasswordCredential(userId);
    return { hasPasswordCredential };
  }
}
