import { and, asc, desc, eq, ilike, sql, SQL } from 'drizzle-orm';
import { getDb } from '@/infrastructure/database/drizzle/client';
import { user, session } from '@/infrastructure/database/drizzle/schema/auth';
import { BanSource } from '@/domain/user/entity/ban-source';
import {
  BackofficeUserListItem,
  BackofficeUserRepositoryInterface,
  ListBackofficeUsersCriteria,
  ListBackofficeUsersResult,
} from '@/domain/user/repository/backoffice-user-repository.interface';

const VALID_BAN_SOURCES = new Set<string>([
  BanSource.USER_REQUESTED_DELETION,
  BanSource.STAFF,
  BanSource.OTHER,
]);

export class DrizzleBackofficeUserRepository implements BackofficeUserRepositoryInterface {
  async list(criteria: ListBackofficeUsersCriteria): Promise<ListBackofficeUsersResult> {
    const db = getDb();
    const conditions = this.buildWhere(criteria);
    const whereClause = conditions.length ? and(...conditions) : undefined;

    const lastSeen = db
      .select({
        userId: session.userId,
        lastSeenAt: sql<string | null>`max(${session.updatedAt})`.as('last_seen_at'),
      })
      .from(session)
      .groupBy(session.userId)
      .as('last_seen');

    const offset = (criteria.page - 1) * criteria.pageSize;

    const rowsPromise = db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        banned: user.banned,
        banReason: user.banReason,
        banSource: user.banSource,
        bannedAt: user.bannedAt,
        createdAt: user.createdAt,
        lastSeenAt: lastSeen.lastSeenAt,
      })
      .from(user)
      .leftJoin(lastSeen, eq(lastSeen.userId, user.id))
      .where(whereClause)
      .orderBy(desc(user.createdAt), asc(user.id))
      .limit(criteria.pageSize)
      .offset(offset);

    const totalPromise = db
      .select({ count: sql<number>`count(*)::int` })
      .from(user)
      .where(whereClause);

    const [rows, totalRows] = await Promise.all([rowsPromise, totalPromise]);

    const items: BackofficeUserListItem[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      emailVerified: row.emailVerified,
      banned: row.banned,
      banReason: row.banReason ?? null,
      banSource: this.parseBanSource(row.banSource),
      bannedAt: row.bannedAt ?? null,
      createdAt: row.createdAt,
      lastSeenAt: this.toDate(row.lastSeenAt),
    }));

    return {
      items,
      total: totalRows[0]?.count ?? 0,
      page: criteria.page,
      pageSize: criteria.pageSize,
    };
  }

  private buildWhere(criteria: ListBackofficeUsersCriteria): SQL[] {
    const conditions: SQL[] = [];
    if (criteria.id) conditions.push(eq(user.id, criteria.id));
    if (criteria.email) conditions.push(ilike(user.email, `%${criteria.email}%`));
    if (criteria.name) conditions.push(ilike(user.name, `%${criteria.name}%`));
    if (criteria.banned !== undefined) conditions.push(eq(user.banned, criteria.banned));
    return conditions;
  }

  private toDate(value: Date | string | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private parseBanSource(value: string | null): BanSource | null {
    if (!value) return null;
    if (VALID_BAN_SOURCES.has(value)) return value as BanSource;
    return BanSource.OTHER;
  }
}
