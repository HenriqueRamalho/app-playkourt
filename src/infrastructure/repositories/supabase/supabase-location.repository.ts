import { supabase } from '@/infrastructure/database/supabase/server/client';
import { City, State } from '@/domain/location/entity/location.interface';
import { LocationRepositoryInterface } from '@/domain/location/repository/location-repository.interface';

export class SupabaseLocationRepository implements LocationRepositoryInterface {
  async findAllStates(): Promise<State[]> {
    const { data, error } = await supabase
      .from('states')
      .select('id, uf, name')
      .order('name', { ascending: true });

    if (error) throw error;
    return data.map((d) => ({ id: d.id, uf: d.uf, name: d.name }));
  }

  async findCitiesByStateId(stateId: number): Promise<City[]> {
    const { data, error } = await supabase
      .from('cities')
      .select('id, name, state_id')
      .eq('state_id', stateId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data.map((d) => ({ id: d.id, name: d.name, stateId: d.state_id }));
  }
}
