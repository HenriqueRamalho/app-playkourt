import { Booking, BookingStatus } from '@/domain/booking/entity/booking.interface';
import { BookingRepositoryInterface } from '@/domain/booking/repository/booking-repository.interface';
import { CourtSchedule } from '@/domain/court/value-object/CourtSchedule';
import { BookingConflict } from '@/domain/booking/value-object/BookingConflict';
import { BusinessHours } from '@/domain/venue/entity/venue.interface';

export interface CreateBookingInput {
  courtId: string;
  userId: string;
  date: string;
  startTime: string;
  durationHours: number;
  businessHours: BusinessHours[];
  isCourtActive: boolean;
}

export class CreateBookingUseCase {
  constructor(private bookingRepository: BookingRepositoryInterface) {}

  async execute(input: CreateBookingInput): Promise<Booking> {
    if (!input.date) throw new Error('Date is required');
    if (!input.startTime) throw new Error('Start time is required');
    if (input.durationHours < 1 || input.durationHours > 4) throw new Error('Duration must be between 1 and 4 hours');
    if (!input.isCourtActive) throw new Error('Esta quadra não está disponível para reservas no momento.');

    const schedule = new CourtSchedule(input.businessHours);

    if (!schedule.isDateOpen(input.date)) {
      const reason = schedule.getClosedReason(input.date);
      throw new Error(reason ?? 'Este dia não está disponível para reservas.');
    }

    if (!schedule.isSlotAvailable(input.date, input.startTime, input.durationHours)) {
      const hours = schedule.getHoursForDate(input.date);
      throw new Error(
        `Horário fora do período de funcionamento. Este local funciona das ${hours?.openTime} às ${hours?.closeTime}.`
      );
    }

    const { businessHours: _, isCourtActive: __, ...bookingData } = input;

    const existingBookings = await this.bookingRepository.findActiveByCourtAndDate(input.courtId, input.date);
    if (BookingConflict.hasConflict(existingBookings, input.startTime, input.durationHours)) {
      throw new Error('Este horário já está reservado. Por favor, escolha outro horário.');
    }

    return this.bookingRepository.create({ ...bookingData, status: BookingStatus.PENDING });
  }
}
