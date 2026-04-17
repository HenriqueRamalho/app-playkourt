import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { getDb } from '@/infrastructure/database/drizzle/client';
import { bookings, courts, venues } from '@/infrastructure/database/drizzle/schema';
import { Booking, BookingStatus } from '@/domain/booking/entity/booking.interface';
import {
  BookingRepositoryInterface,
  BookingWithDetails,
  PaginatedBookings,
} from '@/domain/booking/repository/booking-repository.interface';

type BookingRow = {
  id: string;
  courtId: string;
  userId: string;
  date: string;
  startTime: string;
  durationHours: string;
  status: string;
  createdAt: Date;
};

type BookingJoinRow = BookingRow & {
  courtName: string | null;
  sportType: string | null;
  venueName: string | null;
};

const ACTIVE_STATUSES: BookingStatus[] = [BookingStatus.PENDING, BookingStatus.CONFIRMED];

export class DrizzleBookingRepository implements BookingRepositoryInterface {
  private toBooking(row: BookingRow): Booking {
    return {
      id: row.id,
      courtId: row.courtId,
      userId: row.userId,
      date: row.date,
      startTime: row.startTime,
      durationHours: Number(row.durationHours),
      status: row.status as BookingStatus,
      createdAt: row.createdAt,
    };
  }

  private toBookingWithDetails(row: BookingJoinRow): BookingWithDetails {
    return {
      ...this.toBooking(row),
      courtName: row.courtName ?? '',
      sportType: row.sportType ?? '',
      venueName: row.venueName ?? '',
    };
  }

  async create(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
    const db = getDb();
    const [row] = await db
      .insert(bookings)
      .values({
        courtId: booking.courtId,
        userId: booking.userId,
        date: booking.date,
        startTime: booking.startTime,
        durationHours: String(booking.durationHours),
        status: booking.status,
      })
      .returning();
    return this.toBooking(row);
  }

  async findById(id: string): Promise<BookingWithDetails | null> {
    const db = getDb();
    const rows = await db
      .select({
        id: bookings.id,
        courtId: bookings.courtId,
        userId: bookings.userId,
        date: bookings.date,
        startTime: bookings.startTime,
        durationHours: bookings.durationHours,
        status: bookings.status,
        createdAt: bookings.createdAt,
        courtName: courts.name,
        sportType: courts.sportType,
        venueName: venues.name,
      })
      .from(bookings)
      .innerJoin(courts, eq(courts.id, bookings.courtId))
      .innerJoin(venues, eq(venues.id, courts.venueId))
      .where(eq(bookings.id, id))
      .limit(1);

    if (!rows.length) return null;
    return this.toBookingWithDetails(rows[0]);
  }

  async findByUserId(userId: string, page: number, pageSize: number): Promise<PaginatedBookings> {
    const db = getDb();
    const offset = (page - 1) * pageSize;

    // Roda data-query e count em paralelo. Mantém semântica de count exato
    // (equivalente ao `count: 'exact'` da implementação anterior). Otimizações
    // de paginação por cursor ficam para um PR dedicado.
    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: bookings.id,
          courtId: bookings.courtId,
          userId: bookings.userId,
          date: bookings.date,
          startTime: bookings.startTime,
          durationHours: bookings.durationHours,
          status: bookings.status,
          createdAt: bookings.createdAt,
          courtName: courts.name,
          sportType: courts.sportType,
          venueName: venues.name,
        })
        .from(bookings)
        .innerJoin(courts, eq(courts.id, bookings.courtId))
        .innerJoin(venues, eq(venues.id, courts.venueId))
        .where(eq(bookings.userId, userId))
        .orderBy(desc(bookings.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(bookings)
        .where(eq(bookings.userId, userId)),
    ]);

    return {
      data: data.map((r) => this.toBookingWithDetails(r)),
      total: totalResult[0]?.total ?? 0,
      page,
      pageSize,
    };
  }

  async findByCourtId(courtId: string): Promise<Booking[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(bookings)
      .where(eq(bookings.courtId, courtId))
      .orderBy(bookings.date);
    return rows.map((r) => this.toBooking(r));
  }

  async findActiveByCourtAndDate(courtId: string, date: string): Promise<Booking[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.courtId, courtId),
          eq(bookings.date, date),
          inArray(bookings.status, ACTIVE_STATUSES),
        ),
      );
    return rows.map((r) => this.toBooking(r));
  }

  async findByVenueId(venueId: string, page: number, pageSize: number): Promise<PaginatedBookings> {
    const db = getDb();
    const offset = (page - 1) * pageSize;

    // Join direto courts.venue_id → bookings.court_id, evitando a dupla query
    // (courts → IN) da implementação Supabase.
    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: bookings.id,
          courtId: bookings.courtId,
          userId: bookings.userId,
          date: bookings.date,
          startTime: bookings.startTime,
          durationHours: bookings.durationHours,
          status: bookings.status,
          createdAt: bookings.createdAt,
          courtName: courts.name,
          sportType: courts.sportType,
          venueName: venues.name,
        })
        .from(bookings)
        .innerJoin(courts, eq(courts.id, bookings.courtId))
        .innerJoin(venues, eq(venues.id, courts.venueId))
        .where(eq(courts.venueId, venueId))
        .orderBy(desc(bookings.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(bookings)
        .innerJoin(courts, eq(courts.id, bookings.courtId))
        .where(eq(courts.venueId, venueId)),
    ]);

    return {
      data: data.map((r) => this.toBookingWithDetails(r)),
      total: totalResult[0]?.total ?? 0,
      page,
      pageSize,
    };
  }

  async updateStatus(id: string, status: Booking['status']): Promise<Booking> {
    const db = getDb();
    const [row] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return this.toBooking(row);
  }
}
