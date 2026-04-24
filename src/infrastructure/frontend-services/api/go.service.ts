import { SportType } from '@/domain/court/entity/court.interface';
import { BookingStatus } from '@/domain/booking/entity/booking.interface';
import { BusinessHours } from '@/domain/venue/entity/venue.interface';
import { CourtDateException, CourtRecurringBlock } from '@/domain/court/entity/court.interface';

export interface CourtDetailDTO {
  id: string;
  venueId: string;
  name: string;
  sportType: SportType;
  description?: string;
  pricePerHour: number;
  venueName: string;
  neighborhood: string;
  cityName: string;
  businessHours: BusinessHours[];
  dateExceptions: CourtDateException[];
  recurringBlocks: CourtRecurringBlock[];
}

export interface AvailableCourtDTO {
  courtId: string;
  courtName: string;
  sportType: SportType;
  pricePerHour: number;
  description?: string;
  venueId: string;
  venueName: string;
  neighborhood: string;
  cityName: string;
}

export interface VenueSearchResultDTO {
  venueId: string;
  venueName: string;
  street: string;
  number: string;
  neighborhood: string;
  cityName: string;
  sports: { sportType: SportType; count: number }[];
}

export interface VenuePhotoDTO {
  publicUrl: string;
  originalName: string | null;
}

export interface VenueDetailDTO {
  venue: {
    id: string;
    name: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    cityName: string;
    stateUf: string;
    phone?: string;
    businessHours: BusinessHours[];
    minBookingLeadMinutes?: number | null;
  };
  courts: {
    id: string;
    name: string;
    sportType: SportType;
    description?: string;
    pricePerHour: number;
  }[];
  images: VenuePhotoDTO[];
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

export interface PaginatedBookingsDTO {
  data: BookingDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export const goService = {
  async searchAvailable(params: { cityId: number; sportType: SportType; date: string; startTime: string; endTime: string }): Promise<AvailableCourtDTO[]> {
    const query = new URLSearchParams({
      cityId: String(params.cityId),
      sportType: params.sportType,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
    });
    const res = await fetch(`/api/go/courts/available?${query}`);
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to search available courts');
    }
    return res.json();
  },

  async searchCourts(params: { cityId: number; neighborhood?: string; sportType?: SportType }): Promise<VenueSearchResultDTO[]> {
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

  async listMyBookings(page = 1, pageSize = 20): Promise<PaginatedBookingsDTO> {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    const res = await fetch(`/api/go/bookings?${query}`);
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to list bookings');
    }
    return res.json();
  },

  async createBooking(input: { courtId: string; date: string; startTime: string; durationHours: number }): Promise<BookingDTO> {
    const res = await fetch('/api/go/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to create booking');
    }
    return res.json();
  },

  async getVenueWithCourts(venueId: string): Promise<VenueDetailDTO> {
    const res = await fetch(`/api/go/venues/${venueId}`);
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Venue not found');
    }
    return res.json();
  },

  async getCourtById(courtId: string): Promise<CourtDetailDTO> {
    const res = await fetch(`/api/go/courts/${courtId}`);
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Court not found');
    }
    return res.json();
  },
};
