import { supabase } from '@/infrastructure/database/supabase/server/client';
import { Court, SportType } from '@/domain/court/entity/court.interface';
import { CourtEntity } from '@/domain/court/entity/court.entity';
import { CourtRepositoryInterface } from '@/domain/court/repository/court-repository.interface';

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
}
