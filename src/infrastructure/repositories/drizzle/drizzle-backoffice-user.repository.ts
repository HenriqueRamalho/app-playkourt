import { and, asc, desc, eq, gt, gte, ilike, lte, sql, SQL } from 'drizzle-orm';
import { getDb } from '@/infrastructure/database/drizzle/client';
import { user, session, account } from '@/infrastructure/database/drizzle/schema/auth';
import { venues } from '@/infrastructure/database/drizzle/schema/venues';
import { venueMembers } from '@/infrastructure/database/drizzle/schema/venueMembers';
import { courts } from '@/infrastructure/database/drizzle/schema/courts';
import { bookings } from '@/infrastructure/database/drizzle/schema/bookings';
import { cities } from '@/infrastructure/database/drizzle/schema/cities';
import { states } from '@/infrastructure/database/drizzle/schema/states';
import { BanSource } from '@/domain/user/entity/ban-source';
import { BookingStatus } from '@/domain/booking/entity/booking.interface';
import {
  BackofficeUserActiveSession,
  BackofficeUserBanState,
  BackofficeUserBanTarget,
  BackofficeUserBookingItem,
  BackofficeUserListItem,
  BackofficeUserOverview,
  BackofficeUserOverviewBooking,
  BackofficeUserRepositoryInterface,
  BackofficeUserVenues,
  BanUserInput,
  ListBackofficeUserBookingsCriteria,
  ListBackofficeUserBookingsResult,
  ListBackofficeUsersCriteria,
  ListBackofficeUsersResult,
} from '@/domain/user/repository/backoffice-user-repository.interface';

const VALID_BAN_SOURCES = new Set<string>([
  BanSource.USER_REQUESTED_DELETION,
  BanSource.STAFF,
  BanSource.OTHER,
]);

const RECENT_BOOKINGS_LIMIT = 5;
const ACTIVE_SESSIONS_HARD_CAP = 50;

export class DrizzleBackofficeUserRepository implements BackofficeUserRepositoryInterface {
  async list(criteria: ListBackofficeUsersCriteria): Promise<ListBackofficeUsersResult> {
    const db = getDb();
    const conditions = this.buildListWhere(criteria);
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

  async findOverviewById(userId: string): Promise<BackofficeUserOverview | null> {
    const db = getDb();

    const [userRow] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    if (!userRow) return null;

    const [
      lastSeenRow,
      providerRows,
      venuesOwnedRow,
      venuesMemberRow,
      bookingsCountRow,
      recentBookingRows,
      lastActiveSessionRow,
    ] = await Promise.all([
      db
        .select({ lastSeenAt: sql<string | null>`max(${session.updatedAt})` })
        .from(session)
        .where(eq(session.userId, userId)),
      db
        .selectDistinct({ providerId: account.providerId })
        .from(account)
        .where(eq(account.userId, userId)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(venues)
        .where(eq(venues.ownerId, userId)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(venueMembers)
        .where(eq(venueMembers.userId, userId)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookings)
        .where(eq(bookings.userId, userId)),
      db
        .select({
          id: bookings.id,
          date: bookings.date,
          startTime: bookings.startTime,
          durationHours: bookings.durationHours,
          status: bookings.status,
          courtName: courts.name,
          venueName: venues.name,
        })
        .from(bookings)
        .innerJoin(courts, eq(courts.id, bookings.courtId))
        .innerJoin(venues, eq(venues.id, courts.venueId))
        .where(eq(bookings.userId, userId))
        .orderBy(desc(bookings.date), desc(bookings.startTime))
        .limit(RECENT_BOOKINGS_LIMIT),
      db
        .select({
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          updatedAt: session.updatedAt,
        })
        .from(session)
        .where(and(eq(session.userId, userId), gt(session.expiresAt, sql`now()`)))
        .orderBy(desc(session.updatedAt))
        .limit(1),
    ]);

    const recentBookings: BackofficeUserOverviewBooking[] = recentBookingRows.map((row) => ({
      id: row.id,
      date: row.date,
      startTime: this.normalizeTime(row.startTime),
      durationHours: Number(row.durationHours),
      status: this.parseBookingStatus(row.status),
      courtName: row.courtName,
      venueName: row.venueName,
    }));

    return {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      emailVerified: userRow.emailVerified,
      image: userRow.image ?? null,
      createdAt: userRow.createdAt,
      updatedAt: userRow.updatedAt,
      lastSeenAt: this.toDate(lastSeenRow[0]?.lastSeenAt ?? null),

      banned: userRow.banned,
      banReason: userRow.banReason ?? null,
      banSource: this.parseBanSource(userRow.banSource),
      bannedAt: userRow.bannedAt ?? null,

      providers: providerRows.map((row) => row.providerId),

      venuesOwnedCount: venuesOwnedRow[0]?.count ?? 0,
      venuesMemberCount: venuesMemberRow[0]?.count ?? 0,
      bookingsCount: bookingsCountRow[0]?.count ?? 0,
      paymentsCount: null,

      recentBookings,
      lastActiveSession: lastActiveSessionRow[0]
        ? {
            ipAddress: lastActiveSessionRow[0].ipAddress,
            userAgent: lastActiveSessionRow[0].userAgent,
            updatedAt: lastActiveSessionRow[0].updatedAt,
          }
        : null,
    };
  }

  async listVenues(userId: string): Promise<BackofficeUserVenues> {
    const db = getDb();

    const [ownedRows, memberRows] = await Promise.all([
      db
        .select({
          id: venues.id,
          name: venues.name,
          cityName: cities.name,
          stateUf: states.uf,
          isActive: venues.isActive,
          createdAt: venues.createdAt,
        })
        .from(venues)
        .leftJoin(cities, eq(cities.id, venues.cityId))
        .leftJoin(states, eq(states.id, venues.stateId))
        .where(eq(venues.ownerId, userId))
        .orderBy(desc(venues.createdAt)),
      db
        .select({
          id: venues.id,
          name: venues.name,
          role: venueMembers.role,
          cityName: cities.name,
          stateUf: states.uf,
          isActive: venues.isActive,
        })
        .from(venueMembers)
        .innerJoin(venues, eq(venues.id, venueMembers.venueId))
        .leftJoin(cities, eq(cities.id, venues.cityId))
        .leftJoin(states, eq(states.id, venues.stateId))
        .where(eq(venueMembers.userId, userId))
        .orderBy(asc(venues.name)),
    ]);

    return {
      owned: ownedRows.map((row) => ({
        id: row.id,
        name: row.name,
        cityName: row.cityName ?? '',
        stateUf: row.stateUf ?? '',
        isActive: row.isActive ?? true,
        createdAt: row.createdAt ?? new Date(),
      })),
      member: memberRows.map((row) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        cityName: row.cityName ?? '',
        stateUf: row.stateUf ?? '',
        isActive: row.isActive ?? true,
      })),
    };
  }

  async listBookings(
    criteria: ListBackofficeUserBookingsCriteria,
  ): Promise<ListBackofficeUserBookingsResult> {
    const db = getDb();
    const conditions = this.buildBookingsWhere(criteria);
    const whereClause = and(...conditions);
    const offset = (criteria.page - 1) * criteria.pageSize;

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          id: bookings.id,
          date: bookings.date,
          startTime: bookings.startTime,
          durationHours: bookings.durationHours,
          status: bookings.status,
          courtId: courts.id,
          courtName: courts.name,
          venueId: venues.id,
          venueName: venues.name,
          createdAt: bookings.createdAt,
        })
        .from(bookings)
        .innerJoin(courts, eq(courts.id, bookings.courtId))
        .innerJoin(venues, eq(venues.id, courts.venueId))
        .where(whereClause)
        .orderBy(desc(bookings.date), desc(bookings.startTime), asc(bookings.id))
        .limit(criteria.pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookings)
        .where(whereClause),
    ]);

    const items: BackofficeUserBookingItem[] = rows.map((row) => ({
      id: row.id,
      date: row.date,
      startTime: this.normalizeTime(row.startTime),
      durationHours: Number(row.durationHours),
      status: this.parseBookingStatus(row.status),
      courtId: row.courtId,
      courtName: row.courtName,
      venueId: row.venueId,
      venueName: row.venueName,
      createdAt: row.createdAt,
    }));

    return {
      items,
      total: totalRows[0]?.count ?? 0,
      page: criteria.page,
      pageSize: criteria.pageSize,
    };
  }

  async findBanTargetById(userId: string): Promise<BackofficeUserBanTarget | null> {
    const db = getDb();
    const [row] = await db
      .select({
        id: user.id,
        email: user.email,
        banned: user.banned,
        banReason: user.banReason,
        banSource: user.banSource,
        bannedAt: user.bannedAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      banned: row.banned,
      banReason: row.banReason ?? null,
      banSource: this.parseBanSource(row.banSource),
      bannedAt: row.bannedAt ?? null,
    };
  }

  async banUser(userId: string, input: BanUserInput): Promise<BackofficeUserBanState> {
    const db = getDb();
    const now = new Date();
    const [row] = await db
      .update(user)
      .set({
        banned: true,
        banReason: input.reason,
        banSource: input.source,
        bannedAt: now,
        updatedAt: now,
      })
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        banned: user.banned,
        banReason: user.banReason,
        banSource: user.banSource,
        bannedAt: user.bannedAt,
      });

    return {
      id: row.id,
      banned: row.banned,
      banReason: row.banReason ?? null,
      banSource: this.parseBanSource(row.banSource),
      bannedAt: row.bannedAt ?? null,
    };
  }

  async unbanUser(userId: string): Promise<BackofficeUserBanState> {
    const db = getDb();
    const [row] = await db
      .update(user)
      .set({
        banned: false,
        banReason: null,
        banSource: null,
        bannedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        banned: user.banned,
        banReason: user.banReason,
        banSource: user.banSource,
        bannedAt: user.bannedAt,
      });

    return {
      id: row.id,
      banned: row.banned,
      banReason: row.banReason ?? null,
      banSource: this.parseBanSource(row.banSource),
      bannedAt: row.bannedAt ?? null,
    };
  }

  async deleteSessionsOfUser(userId: string): Promise<number> {
    const db = getDb();
    const rows = await db
      .delete(session)
      .where(eq(session.userId, userId))
      .returning({ id: session.id });
    return rows.length;
  }

  async listActiveSessions(userId: string): Promise<BackofficeUserActiveSession[]> {
    const db = getDb();
    const rows = await db
      .select({
        id: session.id,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        expiresAt: session.expiresAt,
      })
      .from(session)
      .where(and(eq(session.userId, userId), gt(session.expiresAt, sql`now()`)))
      .orderBy(desc(session.updatedAt))
      .limit(ACTIVE_SESSIONS_HARD_CAP);

    return rows.map((row) => ({
      id: row.id,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      expiresAt: row.expiresAt,
    }));
  }

  private buildListWhere(criteria: ListBackofficeUsersCriteria): SQL[] {
    const conditions: SQL[] = [];
    if (criteria.id) conditions.push(eq(user.id, criteria.id));
    if (criteria.email) conditions.push(ilike(user.email, `%${criteria.email}%`));
    if (criteria.name) conditions.push(ilike(user.name, `%${criteria.name}%`));
    if (criteria.banned !== undefined) conditions.push(eq(user.banned, criteria.banned));
    return conditions;
  }

  private buildBookingsWhere(criteria: ListBackofficeUserBookingsCriteria): SQL[] {
    const conditions: SQL[] = [eq(bookings.userId, criteria.userId)];
    if (criteria.status) conditions.push(eq(bookings.status, criteria.status));
    if (criteria.from) conditions.push(gte(bookings.date, criteria.from));
    if (criteria.to) conditions.push(lte(bookings.date, criteria.to));
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

  private parseBookingStatus(value: string): BookingStatus {
    switch (value) {
      case BookingStatus.PENDING:
      case BookingStatus.CONFIRMED:
      case BookingStatus.CANCELLED:
        return value;
      default:
        return BookingStatus.PENDING;
    }
  }

  private normalizeTime(value: string): string {
    return value.length >= 5 ? value.slice(0, 5) : value;
  }
}
