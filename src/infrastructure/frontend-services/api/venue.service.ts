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

async function handle<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: null }));
    throw new Error(error ?? fallback);
  }
  return res.json() as Promise<T>;
}

export const venueService = {
  async getById(id: string): Promise<VenueDTO> {
    const res = await fetch(`/api/venues/${id}`);
    return handle(res, 'Failed to fetch venue');
  },

  async list(): Promise<VenueDTO[]> {
    const res = await fetch('/api/venues');
    return handle(res, 'Failed to list venues');
  },

  async update(id: string, dto: Partial<CreateVenueDTO>): Promise<VenueDTO> {
    const res = await fetch(`/api/venues/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    return handle(res, 'Failed to update venue');
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/venues/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: null }));
      throw new Error(error ?? 'Failed to delete venue');
    }
  },

  async create(dto: CreateVenueDTO): Promise<VenueDTO> {
    const res = await fetch('/api/venues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    return handle(res, 'Failed to create venue');
  },
};
