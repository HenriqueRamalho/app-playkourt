import { Booking } from '../entity/booking.interface';

export type BookingWithDetails = Booking & { courtName: string; venueName: string; sportType: string };

export interface BookingRepositoryInterface {
  create(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking>;
  findByUserId(userId: string): Promise<BookingWithDetails[]>;
  findByCourtId(courtId: string): Promise<Booking[]>;
}
