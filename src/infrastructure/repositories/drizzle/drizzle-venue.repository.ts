import { eq, desc, inArray, sql } from 'drizzle-orm';
import { getDb } from '@/infrastructure/database/drizzle/client';
import { venues, cities, states, venueBusinessHours, venueMembers } from '@/infrastructure/database/drizzle/schema';
import { Venue, BusinessHours } from '@/domain/venue/entity/venue.interface';
import { VenueEntity } from '@/domain/venue/entity/venue.entity';
import { VenueMember, VenueMemberRole } from '@/domain/venue/entity/venue-member.interface';
import { VenueRepositoryInterface } from '@/domain/venue/repository/venue-repository.interface';

type VenueJoinRow = {
  id: string;
  ownerId: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  cityId: number;
  cityName: string | null;
  stateId: number;
  stateName: string | null;
  stateUf: string | null;
  zipCode: string | null;
  latitude: string | null;
  longitude: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
};

type BusinessHoursRow = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

export class DrizzleVenueRepository implements VenueRepositoryInterface {
  private toDomain(row: VenueJoinRow, businessHours: BusinessHours[]): Venue {
    return new VenueEntity({
      id: row.id,
      ownerId: row.ownerId,
      name: row.name,
      cnpj: row.cnpj ?? undefined,
      phone: row.phone ?? undefined,
      street: row.street ?? undefined,
      number: row.number ?? undefined,
      complement: row.complement ?? undefined,
      neighborhood: row.neighborhood ?? undefined,
      cityId: row.cityId,
      cityName: row.cityName ?? '',
      stateId: row.stateId,
      stateName: row.stateName ?? '',
      stateUf: row.stateUf ?? '',
      zipCode: row.zipCode ?? undefined,
      latitude: row.latitude != null ? Number(row.latitude) : undefined,
      longitude: row.longitude != null ? Number(row.longitude) : undefined,
      isActive: row.isActive ?? true,
      businessHours,
      createdAt: row.createdAt ?? new Date(),
    });
  }

  private toBusinessHours(rows: BusinessHoursRow[]): BusinessHours[] {
    return rows.map((h) => ({
      dayOfWeek: h.dayOfWeek as BusinessHours['dayOfWeek'],
      openTime: h.openTime,
      closeTime: h.closeTime,
      isClosed: h.isClosed,
    }));
  }

  private venueSelectFields() {
    return {
      id: venues.id,
      ownerId: venues.ownerId,
      name: venues.name,
      cnpj: venues.cnpj,
      phone: venues.phone,
      street: venues.street,
      number: venues.number,
      complement: venues.complement,
      neighborhood: venues.neighborhood,
      cityId: venues.cityId,
      cityName: cities.name,
      stateId: venues.stateId,
      stateName: states.name,
      stateUf: states.uf,
      zipCode: venues.zipCode,
      latitude: venues.latitude,
      longitude: venues.longitude,
      isActive: venues.isActive,
      createdAt: venues.createdAt,
    };
  }

  private async loadBusinessHoursMap(venueIds: string[]): Promise<Map<string, BusinessHours[]>> {
    const map = new Map<string, BusinessHours[]>();
    if (!venueIds.length) return map;

    const db = getDb();
    const rows = await db
      .select({
        venueId: venueBusinessHours.venueId,
        dayOfWeek: venueBusinessHours.dayOfWeek,
        openTime: venueBusinessHours.openTime,
        closeTime: venueBusinessHours.closeTime,
        isClosed: venueBusinessHours.isClosed,
      })
      .from(venueBusinessHours)
      .where(inArray(venueBusinessHours.venueId, venueIds));

    for (const row of rows) {
      const list = map.get(row.venueId) ?? [];
      list.push({
        dayOfWeek: row.dayOfWeek as BusinessHours['dayOfWeek'],
        openTime: row.openTime,
        closeTime: row.closeTime,
        isClosed: row.isClosed,
      });
      map.set(row.venueId, list);
    }
    return map;
  }

  private async upsertBusinessHours(venueId: string, businessHours: BusinessHours[]): Promise<void> {
    if (!businessHours.length) return;
    const db = getDb();
    const rows = businessHours.map((h) => ({
      venueId,
      dayOfWeek: h.dayOfWeek,
      openTime: h.openTime ?? '08:00',
      closeTime: h.closeTime ?? '22:00',
      isClosed: h.isClosed,
    }));
    await db
      .insert(venueBusinessHours)
      .values(rows)
      .onConflictDoUpdate({
        target: [venueBusinessHours.venueId, venueBusinessHours.dayOfWeek],
        set: {
          openTime: sql`excluded.open_time`,
          closeTime: sql`excluded.close_time`,
          isClosed: sql`excluded.is_closed`,
        },
      });
  }

  async create(venue: Omit<Venue, 'id' | 'createdAt' | 'cityName' | 'stateName' | 'stateUf'>): Promise<Venue> {
    const db = getDb();
    const [inserted] = await db
      .insert(venues)
      .values({
        ownerId: venue.ownerId,
        name: venue.name,
        cnpj: venue.cnpj ?? null,
        phone: venue.phone ?? null,
        street: venue.street ?? null,
        number: venue.number ?? null,
        complement: venue.complement ?? null,
        neighborhood: venue.neighborhood ?? null,
        cityId: venue.cityId,
        stateId: venue.stateId,
        zipCode: venue.zipCode ?? null,
        latitude: venue.latitude != null ? String(venue.latitude) : null,
        longitude: venue.longitude != null ? String(venue.longitude) : null,
        isActive: venue.isActive,
      })
      .returning({ id: venues.id });

    await this.upsertBusinessHours(inserted.id, venue.businessHours ?? []);

    return (await this.findById(inserted.id))!;
  }

  async findById(id: string): Promise<Venue | null> {
    const db = getDb();
    const rows = await db
      .select(this.venueSelectFields())
      .from(venues)
      .leftJoin(cities, eq(cities.id, venues.cityId))
      .leftJoin(states, eq(states.id, venues.stateId))
      .where(eq(venues.id, id))
      .limit(1);

    if (!rows.length) return null;

    const hoursMap = await this.loadBusinessHoursMap([id]);
    return this.toDomain(rows[0], hoursMap.get(id) ?? []);
  }

  async findByOwnerId(ownerId: string): Promise<Venue[]> {
    const db = getDb();
    const rows = await db
      .select(this.venueSelectFields())
      .from(venues)
      .leftJoin(cities, eq(cities.id, venues.cityId))
      .leftJoin(states, eq(states.id, venues.stateId))
      .where(eq(venues.ownerId, ownerId))
      .orderBy(desc(venues.createdAt));

    const hoursMap = await this.loadBusinessHoursMap(rows.map((r) => r.id));
    return rows.map((r) => this.toDomain(r, hoursMap.get(r.id) ?? []));
  }

  async findByMemberId(userId: string): Promise<Venue[]> {
    const db = getDb();
    const rows = await db
      .select(this.venueSelectFields())
      .from(venueMembers)
      .innerJoin(venues, eq(venues.id, venueMembers.venueId))
      .leftJoin(cities, eq(cities.id, venues.cityId))
      .leftJoin(states, eq(states.id, venues.stateId))
      .where(eq(venueMembers.userId, userId));

    const hoursMap = await this.loadBusinessHoursMap(rows.map((r) => r.id));
    return rows.map((r) => this.toDomain(r, hoursMap.get(r.id) ?? []));
  }

  async update(
    id: string,
    venue: Partial<Omit<Venue, 'id' | 'ownerId' | 'createdAt' | 'cityName' | 'stateName' | 'stateUf'>>,
  ): Promise<Venue> {
    const db = getDb();
    const updatePayload: Record<string, unknown> = {};
    if (venue.name !== undefined) updatePayload.name = venue.name;
    if (venue.cnpj !== undefined) updatePayload.cnpj = venue.cnpj;
    if (venue.phone !== undefined) updatePayload.phone = venue.phone;
    if (venue.street !== undefined) updatePayload.street = venue.street;
    if (venue.number !== undefined) updatePayload.number = venue.number;
    if (venue.complement !== undefined) updatePayload.complement = venue.complement;
    if (venue.neighborhood !== undefined) updatePayload.neighborhood = venue.neighborhood;
    if (venue.cityId !== undefined) updatePayload.cityId = venue.cityId;
    if (venue.stateId !== undefined) updatePayload.stateId = venue.stateId;
    if (venue.zipCode !== undefined) updatePayload.zipCode = venue.zipCode;
    if (venue.latitude !== undefined) updatePayload.latitude = venue.latitude != null ? String(venue.latitude) : null;
    if (venue.longitude !== undefined) updatePayload.longitude = venue.longitude != null ? String(venue.longitude) : null;
    if (venue.isActive !== undefined) updatePayload.isActive = venue.isActive;

    if (Object.keys(updatePayload).length) {
      await db.update(venues).set(updatePayload).where(eq(venues.id, id));
    }

    if (venue.businessHours) {
      await this.upsertBusinessHours(id, venue.businessHours);
    }

    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    const db = getDb();
    await db.delete(venues).where(eq(venues.id, id));
  }

  async addMember(venueId: string, userId: string, role: VenueMemberRole): Promise<VenueMember> {
    const db = getDb();
    const [row] = await db
      .insert(venueMembers)
      .values({ venueId, userId, role })
      .returning();
    return {
      id: row.id,
      venueId: row.venueId,
      userId: row.userId,
      role: row.role as VenueMemberRole,
      createdAt: row.createdAt ?? new Date(),
    };
  }
}
