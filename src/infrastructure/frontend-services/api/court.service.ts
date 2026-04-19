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

async function handle<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: null }));
    throw new Error(error ?? fallback);
  }
  return res.json() as Promise<T>;
}

export const courtService = {
  async getById(venueId: string, courtId: string): Promise<CourtDTO> {
    const res = await fetch(`/api/venues/${venueId}/courts/${courtId}`);
    return handle(res, 'Failed to fetch court');
  },

  async update(venueId: string, courtId: string, dto: Partial<CreateCourtDTO>): Promise<CourtDTO> {
    const res = await fetch(`/api/venues/${venueId}/courts/${courtId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    return handle(res, 'Failed to update court');
  },

  async delete(venueId: string, courtId: string): Promise<void> {
    const res = await fetch(`/api/venues/${venueId}/courts/${courtId}`, { method: 'DELETE' });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: null }));
      throw new Error(error ?? 'Failed to delete court');
    }
  },

  async listByVenue(venueId: string): Promise<CourtDTO[]> {
    const res = await fetch(`/api/venues/${venueId}/courts`);
    return handle(res, 'Failed to list courts');
  },

  async create(venueId: string, dto: CreateCourtDTO): Promise<CourtDTO> {
    const res = await fetch(`/api/venues/${venueId}/courts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    return handle(res, 'Failed to create court');
  },

  async updateSchedule(venueId: string, courtId: string, dto: CourtScheduleDTO): Promise<UpdateScheduleResponseDTO> {
    const res = await fetch(`/api/venues/${venueId}/courts/${courtId}/schedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    return handle(res, 'Failed to update court schedule');
  },
};
