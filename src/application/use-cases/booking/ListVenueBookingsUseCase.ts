import { BookingRepositoryInterface, PaginatedBookings } from '@/domain/booking/repository/booking-repository.interface';

export class ListVenueBookingsUseCase {
  constructor(private bookingRepository: BookingRepositoryInterface) {}

  async execute(venueId: string, page: number, pageSize: number): Promise<PaginatedBookings> {
    return this.bookingRepository.findByVenueId(venueId, page, pageSize);
  }
}
