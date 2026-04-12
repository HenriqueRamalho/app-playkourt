import { Booking, BookingStatus } from '@/domain/booking/entity/booking.interface';
import { BookingRepositoryInterface } from '@/domain/booking/repository/booking-repository.interface';

export class UpdateBookingStatusUseCase {
  constructor(private bookingRepository: BookingRepositoryInterface) {}

  async execute(id: string, status: BookingStatus): Promise<Booking> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) throw new Error('Booking not found');
    if (booking.status === BookingStatus.CANCELLED) throw new Error('Cannot update a cancelled booking');
    return this.bookingRepository.updateStatus(id, status);
  }
}
