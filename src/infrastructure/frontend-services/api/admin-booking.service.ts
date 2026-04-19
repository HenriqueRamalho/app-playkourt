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

async function handle<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: null }));
    throw new Error(error ?? fallback);
  }
  return res.json() as Promise<T>;
}

export const adminBookingService = {
  async list(venueId: string, page = 1, pageSize = 20): Promise<PaginatedBookingsDTO> {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    const res = await fetch(`/api/admin/venues/${venueId}/reservations?${query}`);
    return handle(res, 'Failed to list reservations');
  },

  async getById(venueId: string, reservationId: string): Promise<AdminBookingDTO> {
    const res = await fetch(`/api/admin/venues/${venueId}/reservations/${reservationId}`);
    return handle(res, 'Failed to fetch reservation');
  },

  async updateStatus(venueId: string, reservationId: string, status: BookingStatus): Promise<AdminBookingDTO> {
    const res = await fetch(`/api/admin/venues/${venueId}/reservations/${reservationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return handle(res, 'Failed to update reservation');
  },
};
