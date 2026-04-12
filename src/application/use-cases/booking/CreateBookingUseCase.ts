import { Booking, BookingStatus } from '@/domain/booking/entity/booking.interface';
import { BookingRepositoryInterface } from '@/domain/booking/repository/booking-repository.interface';

export interface CreateBookingInput {
  courtId: string;
  userId: string;
  date: string;
  startTime: string;
  durationHours: number;
}

export class CreateBookingUseCase {
  constructor(private bookingRepository: BookingRepositoryInterface) {}

  async execute(input: CreateBookingInput): Promise<Booking> {
    if (!input.date) throw new Error('Date is required');
    if (!input.startTime) throw new Error('Start time is required');
    if (input.durationHours < 1 || input.durationHours > 4) throw new Error('Duration must be between 1 and 4 hours');

    return this.bookingRepository.create({ ...input, status: BookingStatus.PENDING });
  }
}
