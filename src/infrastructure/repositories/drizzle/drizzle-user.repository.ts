import { eq } from 'drizzle-orm';
import { getDb } from '@/infrastructure/database/drizzle/client';
import { user } from '@/infrastructure/database/drizzle/schema/auth';
import { session } from '@/infrastructure/database/drizzle/schema/auth';
import { User } from '@/domain/user/entity/user.interface';
import { UserRepositoryInterface } from '@/domain/user/repository/user-repository.interface';
import { UserEntity } from '@/domain/user/entity/user.entity';

export class DrizzleUserRepository implements UserRepositoryInterface {
  async findById(id: string): Promise<User | null> {
    const db = getDb();
    const [row] = await db.select().from(user).where(eq(user.id, id)).limit(1);
    if (!row) return null;

    const [lastSession] = await db
      .select({ createdAt: session.createdAt })
      .from(session)
      .where(eq(session.userId, id))
      .orderBy(session.createdAt)
      .limit(1);

    return new UserEntity({
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.createdAt,
      lastLoginAt: lastSession?.createdAt ?? row.createdAt,
    });
  }

  async updateName(id: string, name: string): Promise<User> {
    const db = getDb();
    const [row] = await db
      .update(user)
      .set({ name, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning();
    if (!row) throw new Error('User not found');
    return new UserEntity({
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.createdAt,
      lastLoginAt: row.updatedAt,
    });
  }
}
