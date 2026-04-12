import { supabase } from '@/infrastructure/database/supabase/server/client';
import { User } from '@/domain/user/entity/user.interface';
import { UserRepositoryInterface } from '@/domain/user/repository/user-repository.interface';
import { UserEntity } from '@/domain/user/entity/user.entity';

export class SupabaseUserRepository implements UserRepositoryInterface {
  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase.auth.admin.getUserById(id);
    if (error) throw error;
    return new UserEntity({
      id: data.user.id,
      email: data.user.email!,
      name: data.user.user_metadata?.name,
      createdAt: new Date(data.user.created_at),
      lastLoginAt: data.user.last_sign_in_at ? new Date(data.user.last_sign_in_at) : new Date(),
    });
  }

  async updateName(id: string, name: string): Promise<User> {
    const { data, error } = await supabase.auth.admin.updateUserById(id, {
      user_metadata: { name },
    });
    if (error) throw error;
    return new UserEntity({
      id: data.user.id,
      email: data.user.email!,
      name: data.user.user_metadata?.name,
      createdAt: new Date(data.user.created_at),
      lastLoginAt: data.user.last_sign_in_at ? new Date(data.user.last_sign_in_at) : new Date(),
    });
  }
}
