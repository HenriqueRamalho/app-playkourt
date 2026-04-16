import { Booking } from '../entity/booking.interface';

export type BookingWithDetails = Booking & { courtName: string; venueName: string; sportType: string };

export interface PaginatedBookings {
  data: BookingWithDetails[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BookingRepositoryInterface {
  create(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking>;
  findByUserId(userId: string): Promise<BookingWithDetails[]>;
  findByCourtId(courtId: string): Promise<Booking[]>;
  findActiveByCourtAndDate(courtId: string, date: string): Promise<Booking[]>;
  findByVenueId(venueId: string, page: number, pageSize: number): Promise<PaginatedBookings>;
  updateStatus(id: string, status: Booking['status']): Promise<Booking>;
  findById(id: string): Promise<BookingWithDetails | null>;
}
