import { User } from '../entity/user.interface';

export interface UserRepositoryInterface {
  findById(id: string): Promise<User | null>;
}
