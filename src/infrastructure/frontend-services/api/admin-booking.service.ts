import { supabase } from '@/infrastructure/frontend-services/supabase';
import { BookingStatus } from '@/domain/booking/entity/booking.interface';

export interface AdminBookingDTO {
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

export interface PaginatedBookingsDTO {
  data: AdminBookingDTO[];
  total: number;
  page: number;
  pageSize: number;
}

async function getAuthHeader(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return `Bearer ${session.access_token}`;
}

export const adminBookingService = {
  async list(venueId: string, page = 1, pageSize = 20): Promise<PaginatedBookingsDTO> {
    const authorization = await getAuthHeader();
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    const res = await fetch(`/api/admin/venues/${venueId}/reservations?${query}`, { headers: { authorization } });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to list reservations');
    }
    return res.json();
  },

  async getById(venueId: string, reservationId: string): Promise<AdminBookingDTO> {
    const authorization = await getAuthHeader();
    const res = await fetch(`/api/admin/venues/${venueId}/reservations/${reservationId}`, { headers: { authorization } });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to fetch reservation');
    }
    return res.json();
  },

  async updateStatus(venueId: string, reservationId: string, status: BookingStatus): Promise<AdminBookingDTO> {
    const authorization = await getAuthHeader();
    const res = await fetch(`/api/admin/venues/${venueId}/reservations/${reservationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to update reservation');
    }
    return res.json();
  },
};
