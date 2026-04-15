import { supabase } from '@/infrastructure/frontend-services/supabase';
import { BusinessHours } from '@/domain/venue/entity/venue.interface';

export interface CreateVenueDTO {
  name: string;
  cnpj?: string;
  phone?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  cityId: number;
  stateId: number;
  zipCode?: string;
  businessHours?: BusinessHours[];
}

export interface VenueDTO {
  id: string;
  ownerId: string;
  name: string;
  cnpj?: string;
  phone?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  cityId: number;
  cityName: string;
  stateId: number;
  stateName: string;
  stateUf: string;
  zipCode?: string;
  isActive: boolean;
  businessHours: BusinessHours[];
  createdAt: string;
}

async function getAuthHeader(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return `Bearer ${session.access_token}`;
}

export const venueService = {
  async getById(id: string): Promise<VenueDTO> {
    const authorization = await getAuthHeader();
    const res = await fetch(`/api/venues/${id}`, { headers: { authorization } });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to fetch venue');
    }
    return res.json();
  },

  async list(): Promise<VenueDTO[]> {
    const authorization = await getAuthHeader();
    const res = await fetch('/api/venues', { headers: { authorization } });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to list venues');
    }
    return res.json();
  },

  async update(id: string, dto: Partial<CreateVenueDTO>): Promise<VenueDTO> {
    const authorization = await getAuthHeader();
    const res = await fetch(`/api/venues/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to update venue');
    }
    return res.json();
  },

  async delete(id: string): Promise<void> {
    const authorization = await getAuthHeader();
    const res = await fetch(`/api/venues/${id}`, {
      method: 'DELETE',
      headers: { authorization },
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to delete venue');
    }
  },

  async create(dto: CreateVenueDTO): Promise<VenueDTO> {
    const authorization = await getAuthHeader();
    const res = await fetch('/api/venues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to create venue');
    }
    return res.json();
  },
};
