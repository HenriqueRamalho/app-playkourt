import { User } from '../entity/user.interface';

export interface UserRepositoryInterface {
  findById(id: string): Promise<User | null>;
  updateName(id: string, name: string): Promise<User>;
  hasPasswordCredential(userId: string): Promise<boolean>;
}
