import { and, eq, ilike, asc, sql } from 'drizzle-orm';
import { getDb } from '@/infrastructure/database/drizzle/client';
import {
  courts,
  courtBusinessHours,
  courtDateExceptions,
  courtRecurringBlocks,
  venues,
  cities,
} from '@/infrastructure/database/drizzle/schema';
import {
  Court,
  SportType,
  CourtDateException,
  CourtRecurringBlock,
  CourtWithSchedule,
} from '@/domain/court/entity/court.interface';
import { CourtEntity } from '@/domain/court/entity/court.entity';
import {
  CourtRepositoryInterface,
  CourtSearchFilters,
  VenueSearchResult,
  AvailabilitySearchFilters,
  AvailableCourtResult,
} from '@/domain/court/repository/court-repository.interface';
import { BusinessHours } from '@/domain/venue/entity/venue.interface';

type CourtRow = typeof courts.$inferSelect;

export class DrizzleCourtRepository implements CourtRepositoryInterface {
  private toDomain(row: CourtRow): Court {
    return new CourtEntity({
      id: row.id,
      venueId: row.venueId,
      name: row.name,
      sportType: row.sportType as SportType,
      description: row.description ?? undefined,
      pricePerHour: Number(row.pricePerHour),
      isActive: row.isActive ?? true,
      useVenueHours: row.useVenueHours,
      createdAt: row.createdAt ?? new Date(),
    });
  }

  async loadSchedule(courtId: string): Promise<{
    businessHours: BusinessHours[];
    dateExceptions: CourtDateException[];
    recurringBlocks: CourtRecurringBlock[];
  }> {
    const db = getDb();
    const [bh, de, rb] = await Promise.all([
      db.select().from(courtBusinessHours).where(eq(courtBusinessHours.courtId, courtId)),
      db.select().from(courtDateExceptions).where(eq(courtDateExceptions.courtId, courtId)),
      db.select().from(courtRecurringBlocks).where(eq(courtRecurringBlocks.courtId, courtId)),
    ]);

    return {
      businessHours: bh.map((h) => ({
        dayOfWeek: h.dayOfWeek as BusinessHours['dayOfWeek'],
        openTime: h.openTime,
        closeTime: h.closeTime,
        isClosed: h.isClosed,
      })),
      dateExceptions: de.map((e) => ({
        date: e.date,
        isFullDayBlock: e.isFullDay,
        startTime: e.startTime ?? undefined,
        endTime: e.endTime ?? undefined,
        reason: e.reason ?? undefined,
      })),
      recurringBlocks: rb.map((b) => ({
        dayOfWeek: b.dayOfWeek as CourtRecurringBlock['dayOfWeek'],
        startTime: b.startTime,
        endTime: b.endTime,
        reason: b.reason ?? undefined,
      })),
    };
  }

  async create(court: Omit<Court, 'id' | 'createdAt'>): Promise<Court> {
    const db = getDb();
    const [row] = await db
      .insert(courts)
      .values({
        venueId: court.venueId,
        name: court.name,
        sportType: court.sportType,
        description: court.description ?? null,
        pricePerHour: String(court.pricePerHour),
        isActive: court.isActive,
        useVenueHours: court.useVenueHours,
      })
      .returning();
    return this.toDomain(row);
  }

  async findById(id: string): Promise<Court | null> {
    const db = getDb();
    const rows = await db.select().from(courts).where(eq(courts.id, id)).limit(1);
    return rows.length ? this.toDomain(rows[0]) : null;
  }

  async findByIdWithSchedule(id: string, venueBusinessHours: BusinessHours[]): Promise<CourtWithSchedule | null> {
    const court = await this.findById(id);
    if (!court) return null;

    const schedule = await this.loadSchedule(id);
    const businessHours = court.useVenueHours ? venueBusinessHours : schedule.businessHours;

    return {
      ...court,
      businessHours,
      dateExceptions: schedule.dateExceptions,
      recurringBlocks: schedule.recurringBlocks,
    };
  }

  async update(id: string, court: Partial<Omit<Court, 'id' | 'venueId' | 'createdAt'>>): Promise<Court> {
    const db = getDb();
    const payload: Record<string, unknown> = {};
    if (court.name !== undefined) payload.name = court.name;
    if (court.sportType !== undefined) payload.sportType = court.sportType;
    if (court.description !== undefined) payload.description = court.description;
    if (court.pricePerHour !== undefined) payload.pricePerHour = String(court.pricePerHour);
    if (court.isActive !== undefined) payload.isActive = court.isActive;
    if (court.useVenueHours !== undefined) payload.useVenueHours = court.useVenueHours;

    const [row] = await db.update(courts).set(payload).where(eq(courts.id, id)).returning();
    return this.toDomain(row);
  }

  async updateSchedule(
    courtId: string,
    businessHours: BusinessHours[],
    dateExceptions: CourtDateException[],
    recurringBlocks: CourtRecurringBlock[],
  ): Promise<void> {
    const db = getDb();
    // Chama a função plpgsql que faz delete+insert atômico das três tabelas.
    await db.execute(sql`
      select update_court_schedule(
        ${courtId}::uuid,
        ${JSON.stringify(businessHours)}::jsonb,
        ${JSON.stringify(dateExceptions)}::jsonb,
        ${JSON.stringify(recurringBlocks)}::jsonb
      )
    `);
  }

  async delete(id: string): Promise<void> {
    const db = getDb();
    await db.delete(courts).where(eq(courts.id, id));
  }

  async findByVenueId(venueId: string): Promise<Court[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(courts)
      .where(eq(courts.venueId, venueId))
      .orderBy(asc(courts.createdAt));
    return rows.map((r) => this.toDomain(r));
  }

  async searchAvailable(filters: AvailabilitySearchFilters): Promise<AvailableCourtResult[]> {
    const [y, m, d] = filters.date.split('-').map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();

    const db = getDb();
    const result = await db.execute<{
      court_id: string;
      court_name: string;
      sport_type: string;
      price_per_hour: string;
      description: string | null;
      venue_id: string;
      venue_name: string;
      neighborhood: string | null;
      city_name: string;
    }>(sql`
      select * from search_available_courts(
        ${filters.cityId}::int,
        ${filters.sportType}::text,
        ${filters.date}::date,
        ${dayOfWeek}::int,
        ${filters.startTime}::time,
        ${filters.endTime}::time
      )
    `);

    return result.map((row) => ({
      courtId: row.court_id,
      courtName: row.court_name,
      sportType: row.sport_type as SportType,
      pricePerHour: Number(row.price_per_hour),
      description: row.description ?? undefined,
      venueId: row.venue_id,
      venueName: row.venue_name,
      neighborhood: row.neighborhood ?? '',
      cityName: row.city_name,
    }));
  }

  async searchVenues(filters: CourtSearchFilters): Promise<VenueSearchResult[]> {
    const db = getDb();
    const conditions = [
      eq(courts.isActive, true),
      eq(venues.cityId, filters.cityId),
    ];
    if (filters.sportType) conditions.push(eq(courts.sportType, filters.sportType));
    if (filters.neighborhood) {
      conditions.push(ilike(venues.neighborhood, `%${filters.neighborhood}%`));
    }

    const rows = await db
      .select({
        sportType: courts.sportType,
        venueId: venues.id,
        venueName: venues.name,
        street: venues.street,
        number: venues.number,
        neighborhood: venues.neighborhood,
        cityName: cities.name,
      })
      .from(courts)
      .innerJoin(venues, eq(venues.id, courts.venueId))
      .leftJoin(cities, eq(cities.id, venues.cityId))
      .where(and(...conditions));

    const venueMap = new Map<string, VenueSearchResult>();
    for (const r of rows) {
      const sportType = r.sportType as SportType;
      if (!venueMap.has(r.venueId)) {
        venueMap.set(r.venueId, {
          venueId: r.venueId,
          venueName: r.venueName,
          street: r.street ?? '',
          number: r.number ?? '',
          neighborhood: r.neighborhood ?? '',
          cityName: r.cityName ?? '',
          sports: [],
        });
      }
      const entry = venueMap.get(r.venueId)!;
      const existing = entry.sports.find((s) => s.sportType === sportType);
      if (existing) existing.count++;
      else entry.sports.push({ sportType, count: 1 });
    }
    return Array.from(venueMap.values());
  }
}
