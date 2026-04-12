import { supabase } from '@/infrastructure/frontend-services/supabase';
import { SportType } from '@/domain/court/entity/court.interface';
import { BookingStatus } from '@/domain/booking/entity/booking.interface';

export interface CourtSearchResultDTO {
  id: string;
  venueId: string;
  name: string;
  sportType: SportType;
  description?: string;
  pricePerHour: number;
  venueName: string;
  neighborhood: string;
  cityName: string;
}

export interface BookingDTO {
  id: string;
  courtId: string;
  userId: string;
  date: string;
  startTime: string;
  durationHours: number;
  status: BookingStatus;
  courtName: string;
  venueName: string;
  sportType: string;
  createdAt: string;
}

async function getAuthHeader(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return `Bearer ${session.access_token}`;
}

export const goService = {
  async searchCourts(params: { cityId: number; neighborhood?: string; sportType?: SportType }): Promise<CourtSearchResultDTO[]> {
    const query = new URLSearchParams({ cityId: String(params.cityId) });
    if (params.neighborhood) query.set('neighborhood', params.neighborhood);
    if (params.sportType) query.set('sportType', params.sportType);

    const res = await fetch(`/api/go/courts?${query}`);
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to search courts');
    }
    return res.json();
  },

  async listMyBookings(): Promise<BookingDTO[]> {
    const authorization = await getAuthHeader();
    const res = await fetch('/api/go/bookings', { headers: { authorization } });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to list bookings');
    }
    return res.json();
  },

  async createBooking(input: { courtId: string; date: string; startTime: string; durationHours: number }): Promise<BookingDTO> {
    const authorization = await getAuthHeader();
    const res = await fetch('/api/go/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to create booking');
    }
    return res.json();
  },

  async getCourtById(courtId: string): Promise<CourtSearchResultDTO> {
    const res = await fetch(`/api/go/courts/${courtId}`);
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Court not found');
    }
    return res.json();
  },
};
