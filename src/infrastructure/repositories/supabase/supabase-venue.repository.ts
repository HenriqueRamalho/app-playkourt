import { supabase } from '@/infrastructure/database/supabase/server/client';
import { Venue } from '@/domain/venue/entity/venue.interface';
import { VenueMember, VenueMemberRole } from '@/domain/venue/entity/venue-member.interface';
import { VenueRepositoryInterface } from '@/domain/venue/repository/venue-repository.interface';
import { VenueEntity } from '@/domain/venue/entity/venue.entity';

const VENUE_SELECT = `
  *,
  cities!city_id ( name ),
  states!state_id ( name, uf )
`;

export class SupabaseVenueRepository implements VenueRepositoryInterface {
  private toDatabase(venue: Omit<Venue, 'id' | 'createdAt' | 'cityName' | 'stateName' | 'stateUf'>) {
    return {
      owner_id: venue.ownerId,
      name: venue.name,
      cnpj: venue.cnpj,
      phone: venue.phone,
      street: venue.street,
      number: venue.number,
      complement: venue.complement,
      neighborhood: venue.neighborhood,
      city_id: venue.cityId,
      state_id: venue.stateId,
      zip_code: venue.zipCode,
      latitude: venue.latitude,
      longitude: venue.longitude,
      is_active: venue.isActive,
    };
  }

  private fromDatabase(data: Record<string, unknown>): Venue {
    const city = data.cities as { name: string } | null;
    const state = data.states as { name: string; uf: string } | null;

    return new VenueEntity({
      id: data.id as string,
      ownerId: data.owner_id as string,
      name: data.name as string,
      cnpj: data.cnpj as string | undefined,
      phone: data.phone as string | undefined,
      street: data.street as string | undefined,
      number: data.number as string | undefined,
      complement: data.complement as string | undefined,
      neighborhood: data.neighborhood as string | undefined,
      cityId: data.city_id as number,
      cityName: city?.name ?? '',
      stateId: data.state_id as number,
      stateName: state?.name ?? '',
      stateUf: state?.uf ?? '',
      zipCode: data.zip_code as string | undefined,
      latitude: data.latitude as number | undefined,
      longitude: data.longitude as number | undefined,
      isActive: data.is_active as boolean,
      createdAt: new Date(data.created_at as string),
    });
  }

  async create(venue: Omit<Venue, 'id' | 'createdAt' | 'cityName' | 'stateName' | 'stateUf'>): Promise<Venue> {
    const { data, error } = await supabase
      .from('venues')
      .insert(this.toDatabase(venue))
      .select(VENUE_SELECT)
      .single();

    if (error) throw error;
    return this.fromDatabase(data as Record<string, unknown>);
  }

  async findById(id: string): Promise<Venue | null> {
    const { data, error } = await supabase
      .from('venues')
      .select(VENUE_SELECT)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? this.fromDatabase(data as Record<string, unknown>) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Venue[]> {
    const { data, error } = await supabase
      .from('venues')
      .select(VENUE_SELECT)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map((d) => this.fromDatabase(d as Record<string, unknown>));
  }

  async findByMemberId(userId: string): Promise<Venue[]> {
    const { data, error } = await supabase
      .from('venue_members')
      .select(`venues ( ${VENUE_SELECT} )`)
      .eq('user_id', userId);

    if (error) throw error;
    return data.map((d) => this.fromDatabase(d.venues as unknown as Record<string, unknown>));
  }

  async update(id: string, venue: Partial<Omit<Venue, 'id' | 'ownerId' | 'createdAt' | 'cityName' | 'stateName' | 'stateUf'>>): Promise<Venue> {
    const { data, error } = await supabase
      .from('venues')
      .update(this.toDatabase({ ...venue } as Omit<Venue, 'id' | 'createdAt' | 'cityName' | 'stateName' | 'stateUf'>))
      .eq('id', id)
      .select(VENUE_SELECT)
      .single();

    if (error) throw error;
    return this.fromDatabase(data as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('venues').delete().eq('id', id);
    if (error) throw error;
  }

  async addMember(venueId: string, userId: string, role: VenueMemberRole): Promise<VenueMember> {
    const { data, error } = await supabase
      .from('venue_members')
      .insert({ venue_id: venueId, user_id: userId, role })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      venueId: data.venue_id,
      userId: data.user_id,
      role: data.role as VenueMemberRole,
      createdAt: new Date(data.created_at),
    };
  }
}
