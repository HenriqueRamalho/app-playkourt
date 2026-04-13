import { supabase } from '@/infrastructure/database/supabase/server/client';
import { Court, SportType } from '@/domain/court/entity/court.interface';
import { CourtEntity } from '@/domain/court/entity/court.entity';
import { CourtRepositoryInterface, CourtSearchFilters, VenueSearchResult } from '@/domain/court/repository/court-repository.interface';

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
      createdAt: new Date(data.created_at as string),
    });
  }

  async create(court: Omit<Court, 'id' | 'createdAt'>): Promise<Court> {
    const { data, error } = await supabase
      .from('courts')
      .insert({
        venue_id: court.venueId,
        name: court.name,
        sport_type: court.sportType,
        description: court.description,
        price_per_hour: court.pricePerHour,
        is_active: court.isActive,
      })
      .select()
      .single();

    if (error) throw error;
    return this.fromDatabase(data);
  }

  async findById(id: string): Promise<Court | null> {
    const { data, error } = await supabase
      .from('courts')
      .select()
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? this.fromDatabase(data) : null;
  }

  async update(id: string, court: Partial<Omit<Court, 'id' | 'venueId' | 'createdAt'>>): Promise<Court> {
    const { data, error } = await supabase
      .from('courts')
      .update({
        name: court.name,
        sport_type: court.sportType,
        description: court.description,
        price_per_hour: court.pricePerHour,
        is_active: court.isActive,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.fromDatabase(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('courts').delete().eq('id', id);
    if (error) throw error;
  }

  async findByVenueId(venueId: string): Promise<Court[]> {
    const { data, error } = await supabase
      .from('courts')
      .select()
      .eq('venue_id', venueId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data.map((d) => this.fromDatabase(d));
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
          venueId: venue.id,
          venueName: venue.name,
          street: venue.street ?? '',
          number: venue.number ?? '',
          neighborhood: venue.neighborhood ?? '',
          cityName: venue.cities?.name ?? '',
          sports: [],
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
