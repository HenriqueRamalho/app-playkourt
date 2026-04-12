import { UserRepositoryInterface } from '@/domain/user/repository/user-repository.interface';
import { User } from '@/domain/user/entity/user.interface';

export class UpdateUserNameUseCase {
  constructor(private userRepository: UserRepositoryInterface) {}

  async execute(id: string, name: string): Promise<User> {
    if (!name.trim()) throw new Error('Name cannot be empty');
    return this.userRepository.updateName(id, name.trim());
  }
}
