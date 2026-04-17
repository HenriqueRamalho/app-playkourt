import { supabase } from '@/infrastructure/database/supabase/server/client';
import { Court, SportType, CourtDateException, CourtRecurringBlock, CourtWithSchedule } from '@/domain/court/entity/court.interface';
import { CourtEntity } from '@/domain/court/entity/court.entity';
import { CourtRepositoryInterface, CourtSearchFilters, VenueSearchResult, AvailabilitySearchFilters, AvailableCourtResult } from '@/domain/court/repository/court-repository.interface';
import { BusinessHours } from '@/domain/venue/entity/venue.interface';

export class SupabaseCourtRepository implements CourtRepositoryInterface {
  private fromDatabase(data: Record<string, unknown>): Court {
    return new CourtEntity({
      id: data.id as string,
      venueId: data.venue_id as string,
      name: data.name as string,
      sportType: data.sport_type as SportType,
      description: data.description as string | undefined,
      pricePerHour: Number(data.price_per_hour),
      isActive: data.is_active as boolean,
      useVenueHours: data.use_venue_hours as boolean ?? true,
      createdAt: new Date(data.created_at as string),
    });
  }

  private fromDatabaseWithSchedule(
    data: Record<string, unknown>,
    businessHours: BusinessHours[],
    dateExceptions: CourtDateException[],
    recurringBlocks: CourtRecurringBlock[],
  ): CourtWithSchedule {
    return { ...this.fromDatabase(data), businessHours, dateExceptions, recurringBlocks };
  }

  async loadSchedule(courtId: string): Promise<{
    businessHours: BusinessHours[];
    dateExceptions: CourtDateException[];
    recurringBlocks: CourtRecurringBlock[];
  }> {
    const [bhRes, deRes, rbRes] = await Promise.all([
      supabase.from('court_business_hours').select('*').eq('court_id', courtId),
      supabase.from('court_date_exceptions').select('*').eq('court_id', courtId),
      supabase.from('court_recurring_blocks').select('*').eq('court_id', courtId),
    ]);

    return {
      businessHours: (bhRes.data ?? []).map((h) => ({
        dayOfWeek: h.day_of_week as BusinessHours['dayOfWeek'],
        openTime: h.open_time as string,
        closeTime: h.close_time as string,
        isClosed: h.is_closed as boolean,
      })),
      dateExceptions: (deRes.data ?? []).map((e) => ({
        date: e.date as string,
        isFullDayBlock: e.is_full_day as boolean,
        startTime: e.start_time as string | undefined,
        endTime: e.end_time as string | undefined,
        reason: e.reason as string | undefined,
      })),
      recurringBlocks: (rbRes.data ?? []).map((b) => ({
        dayOfWeek: b.day_of_week as CourtRecurringBlock['dayOfWeek'],
        startTime: b.start_time as string,
        endTime: b.end_time as string,
        reason: b.reason as string | undefined,
      })),
    };
  }

  async create(court: Omit<Court, 'id' | 'createdAt'>): Promise<Court> {
    const { data, error } = await supabase
      .from('courts')
      .insert({
        venue_id: court.venueId, name: court.name, sport_type: court.sportType,
        description: court.description, price_per_hour: court.pricePerHour,
        is_active: court.isActive, use_venue_hours: court.useVenueHours,
      })
      .select()
      .single();

    if (error) throw error;
    return this.fromDatabase(data);
  }

  async findById(id: string): Promise<Court | null> {
    const { data, error } = await supabase.from('courts').select().eq('id', id).single();
    if (error) return null;
    return this.fromDatabase(data);
  }

  async findByIdWithSchedule(id: string, venueBusinessHours: BusinessHours[]): Promise<CourtWithSchedule | null> {
    const court = await this.findById(id);
    if (!court) return null;

    // Bloqueios (dateExceptions e recurringBlocks) são sempre carregados,
    // independente de useVenueHours — uma court pode ter bloqueios pontuais
    // mesmo herdando o horário do venue.
    const schedule = await this.loadSchedule(id);

    const businessHours = court.useVenueHours
      ? venueBusinessHours
      : schedule.businessHours;

    return {
      ...court,
      businessHours,
      dateExceptions: schedule.dateExceptions,
      recurringBlocks: schedule.recurringBlocks,
    };
  }

  async update(id: string, court: Partial<Omit<Court, 'id' | 'venueId' | 'createdAt'>>): Promise<Court> {
    const { data, error } = await supabase
      .from('courts')
      .update({
        name: court.name, sport_type: court.sportType, description: court.description,
        price_per_hour: court.pricePerHour, is_active: court.isActive,
        use_venue_hours: court.useVenueHours,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.fromDatabase(data);
  }

  async updateSchedule(
    courtId: string,
    businessHours: BusinessHours[],
    dateExceptions: CourtDateException[],
    recurringBlocks: CourtRecurringBlock[],
  ): Promise<void> {
    const { error } = await supabase.rpc('update_court_schedule', {
      p_court_id: courtId,
      p_business_hours: businessHours,
      p_date_exceptions: dateExceptions,
      p_recurring_blocks: recurringBlocks,
    });
    if (error) {
      console.error('updateSchedule RPC error:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('courts').delete().eq('id', id);
    if (error) throw error;
  }

  async findByVenueId(venueId: string): Promise<Court[]> {
    const { data, error } = await supabase
      .from('courts').select().eq('venue_id', venueId).order('created_at', { ascending: true });
    if (error) throw error;
    return data.map((d) => this.fromDatabase(d));
  }

  async searchAvailable(filters: AvailabilitySearchFilters): Promise<AvailableCourtResult[]> {
    const dayOfWeek = new Date(
      Number(filters.date.split('-')[0]),
      Number(filters.date.split('-')[1]) - 1,
      Number(filters.date.split('-')[2])
    ).getDay();

    // Usa RPC para executar a query complexa de disponibilidade no banco.
    // A lógica: quadra ativa + na cidade + modalidade + horário coberto pelo
    // horário efetivo (court ou venue) + sem bloqueio pontual + sem bloqueio
    // recorrente + sem reserva ativa conflitante.
    const { data, error } = await supabase.rpc('search_available_courts', {
      p_city_id: filters.cityId,
      p_sport_type: filters.sportType,
      p_date: filters.date,
      p_day_of_week: dayOfWeek,
      p_start_time: filters.startTime,
      p_end_time: filters.endTime,
    });

    if (error) throw error;

    return (data as Record<string, unknown>[]).map((row) => ({
      courtId: row.court_id as string,
      courtName: row.court_name as string,
      sportType: row.sport_type as SportType,
      pricePerHour: Number(row.price_per_hour),
      description: row.description as string | undefined,
      venueId: row.venue_id as string,
      venueName: row.venue_name as string,
      neighborhood: row.neighborhood as string,
      cityName: row.city_name as string,
    }));
  }

  async searchVenues(filters: CourtSearchFilters): Promise<VenueSearchResult[]> {
    let query = supabase
      .from('courts')
      .select('sport_type, venues!venue_id ( id, name, street, number, neighborhood, cities!city_id ( name ) )')
      .eq('is_active', true)
      .eq('venues.city_id', filters.cityId);

    if (filters.sportType) query = query.eq('sport_type', filters.sportType);
    if (filters.neighborhood) query = query.ilike('venues.neighborhood', `%${filters.neighborhood}%`);

    const { data, error } = await query;
    if (error) throw error;

    const venueMap = new Map<string, VenueSearchResult>();
    for (const d of data as Record<string, unknown>[]) {
      const venue = d.venues as { id: string; name: string; street: string; number: string; neighborhood: string; cities: { name: string } } | null;
      if (!venue) continue;
      const sportType = d.sport_type as SportType;
      if (!venueMap.has(venue.id)) {
        venueMap.set(venue.id, {
          venueId: venue.id, venueName: venue.name, street: venue.street ?? '',
          number: venue.number ?? '', neighborhood: venue.neighborhood ?? '',
          cityName: venue.cities?.name ?? '', sports: [],
        });
      }
      const entry = venueMap.get(venue.id)!;
      const existing = entry.sports.find((s) => s.sportType === sportType);
      if (existing) existing.count++;
      else entry.sports.push({ sportType, count: 1 });
    }
    return Array.from(venueMap.values());
  }
}
