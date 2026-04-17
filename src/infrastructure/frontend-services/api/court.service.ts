import { supabase } from '@/infrastructure/frontend-services/supabase';
import { SportType, CourtDateException, CourtRecurringBlock } from '@/domain/court/entity/court.interface';
import { BusinessHours } from '@/domain/venue/entity/venue.interface';

export interface CreateCourtDTO {
  name: string;
  sportType: SportType;
  description?: string;
  pricePerHour: number;
}

export interface CourtScheduleDTO {
  useVenueHours: boolean;
  businessHours: BusinessHours[];
  dateExceptions: CourtDateException[];
  recurringBlocks: CourtRecurringBlock[];
}

export interface CourtDTO {
  id: string;
  venueId: string;
  name: string;
  sportType: SportType;
  description?: string;
  pricePerHour: number;
  isActive: boolean;
  useVenueHours: boolean;
  businessHours: BusinessHours[];
  dateExceptions: CourtDateException[];
  recurringBlocks: CourtRecurringBlock[];
  createdAt: string;
}

export interface UpdateScheduleResponseDTO {
  court: CourtDTO;
  affectedBookings: { date: string; count: number }[];
}

async function getAuthHeader(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return `Bearer ${session.access_token}`;
}

export const courtService = {
  async getById(venueId: string, courtId: string): Promise<CourtDTO> {
    const authorization = await getAuthHeader();
    const res = await fetch(`/api/venues/${venueId}/courts/${courtId}`, { headers: { authorization } });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to fetch court');
    }
    return res.json();
  },

  async update(venueId: string, courtId: string, dto: Partial<CreateCourtDTO>): Promise<CourtDTO> {
    const authorization = await getAuthHeader();
    const res = await fetch(`/api/venues/${venueId}/courts/${courtId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to update court');
    }
    return res.json();
  },

  async delete(venueId: string, courtId: string): Promise<void> {
    const authorization = await getAuthHeader();
    const res = await fetch(`/api/venues/${venueId}/courts/${courtId}`, {
      method: 'DELETE',
      headers: { authorization },
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to delete court');
    }
  },

  async listByVenue(venueId: string): Promise<CourtDTO[]> {
    const authorization = await getAuthHeader();
    const res = await fetch(`/api/venues/${venueId}/courts`, { headers: { authorization } });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to list courts');
    }
    return res.json();
  },

  async create(venueId: string, dto: CreateCourtDTO): Promise<CourtDTO> {
    const authorization = await getAuthHeader();
    const res = await fetch(`/api/venues/${venueId}/courts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to create court');
    }
    return res.json();
  },

  async updateSchedule(venueId: string, courtId: string, dto: CourtScheduleDTO): Promise<UpdateScheduleResponseDTO> {
    const authorization = await getAuthHeader();
    const res = await fetch(`/api/venues/${venueId}/courts/${courtId}/schedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to update court schedule');
    }
    return res.json();
  },
};
