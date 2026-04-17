import { BookingRepositoryInterface, PaginatedBookings } from '@/domain/booking/repository/booking-repository.interface';

const DEFAULT_PAGE_SIZE = 20;

export class ListUserBookingsUseCase {
  constructor(private bookingRepository: BookingRepositoryInterface) {}

  async execute(userId: string, page = 1, pageSize = DEFAULT_PAGE_SIZE): Promise<PaginatedBookings> {
    return this.bookingRepository.findByUserId(userId, page, pageSize);
  }
}
