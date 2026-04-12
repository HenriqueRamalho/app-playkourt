import { BookingRepositoryInterface, BookingWithDetails } from '@/domain/booking/repository/booking-repository.interface';

export class ListUserBookingsUseCase {
  constructor(private bookingRepository: BookingRepositoryInterface) {}

  async execute(userId: string): Promise<BookingWithDetails[]> {
    return this.bookingRepository.findByUserId(userId);
  }
}
