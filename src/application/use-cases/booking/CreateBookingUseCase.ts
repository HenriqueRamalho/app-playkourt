import { Booking, BookingStatus } from '@/domain/booking/entity/booking.interface';
import { BookingRepositoryInterface } from '@/domain/booking/repository/booking-repository.interface';
import { CourtSchedule } from '@/domain/court/value-object/CourtSchedule';
import { BookingConflict } from '@/domain/booking/value-object/BookingConflict';
import { BusinessHours } from '@/domain/venue/entity/venue.interface';
import { CourtDateException, CourtRecurringBlock } from '@/domain/court/entity/court.interface';
import { EmailSender } from '@/domain/email/service/email-sender.interface';
import {
  renderBookingPendingBookerEmail,
  renderBookingPendingOwnerEmail,
} from '@/infrastructure/services/email/react-email/render-booking-emails';
import {
  parseBookingStartUtc,
  assertMinBookingLead,
} from '@/infrastructure/services/booking/booking-lead-time';

export interface CreateBookingInput {
  courtId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  ownerEmail?: string;
  ownerName?: string;
  courtName?: string;
  venueName?: string;
  date: string;
  startTime: string;
  durationHours: number;
  businessHours: BusinessHours[];
  dateExceptions: CourtDateException[];
  recurringBlocks: CourtRecurringBlock[];
  isCourtActive: boolean;
  minBookingLeadMinutes?: number | null;
  now?: Date;
}

export class CreateBookingUseCase {
  constructor(
    private bookingRepository: BookingRepositoryInterface,
    private emailSender?: EmailSender,
  ) {}

  async execute(input: CreateBookingInput): Promise<Booking> {
    if (!input.date) throw new Error('Date is required');
    if (!input.startTime) throw new Error('Start time is required');
    if (input.durationHours < 1 || input.durationHours > 4) throw new Error('Duration must be between 1 and 4 hours');
    if (!input.isCourtActive) throw new Error('Esta quadra não está disponível para reservas no momento.');

    if (input.minBookingLeadMinutes != null && input.minBookingLeadMinutes > 0) {
      const bookingStartUtc = parseBookingStartUtc(input.date, input.startTime);
      assertMinBookingLead(bookingStartUtc, input.minBookingLeadMinutes, input.now);
    }

    const schedule = new CourtSchedule(input.businessHours, input.dateExceptions, input.recurringBlocks);

    if (!schedule.isDateOpen(input.date)) {
      const reason = schedule.getClosedReason(input.date);
      throw new Error(reason ?? 'Este dia não está disponível para reservas.');
    }

    const slotReason = schedule.getSlotUnavailableReason(input.date, input.startTime, input.durationHours);
    if (slotReason) throw new Error(slotReason);

    const bookingData = {
      courtId: input.courtId,
      userId: input.userId,
      date: input.date,
      startTime: input.startTime,
      durationHours: input.durationHours,
    };

    const existingBookings = await this.bookingRepository.findActiveByCourtAndDate(input.courtId, input.date);
    if (BookingConflict.hasConflict(existingBookings, input.startTime, input.durationHours)) {
      throw new Error('Este horário já está reservado. Por favor, escolha outro horário.');
    }

    const booking = await this.bookingRepository.create({ ...bookingData, status: BookingStatus.PENDING });
    await this.notifyPendingBooking(booking, input);
    return booking;
  }

  private async notifyPendingBooking(booking: Booking, input: CreateBookingInput): Promise<void> {
    if (!this.emailSender) return;

    const courtLabel = input.courtName?.trim() || 'Quadra';
    const venueLabel = input.venueName?.trim() || 'Arena';
    const userLabel = input.userName?.trim() || 'Cliente';
    const ownerLabel = input.ownerName?.trim() || 'Proprietário';

    const requesterEmail = input.userEmail?.trim().toLowerCase();
    const ownerEmail = input.ownerEmail?.trim().toLowerCase();
    const requesterPromises: Promise<unknown>[] = [];

    if (requesterEmail) {
      requesterPromises.push(
        (async () => {
          const { html, text } = await renderBookingPendingBookerEmail({
            userLabel,
            courtLabel,
            venueLabel,
            bookingId: booking.id,
            date: booking.date,
            startTime: booking.startTime,
            durationHours: booking.durationHours,
          });
          return this.emailSender!.sendEmail({
            to: requesterEmail,
            recipientUserId: input.userId,
            subject: `Reserva solicitada (${courtLabel}) - status pendente`,
            html,
            text,
            metadata: {
              bookingId: booking.id,
              courtId: booking.courtId,
              recipientType: 'booker',
              bookingStatus: booking.status,
            },
            templateName: 'booking/pending-booker',
          });
        })(),
      );
    }

    if (ownerEmail) {
      requesterPromises.push(
        (async () => {
          const { html, text } = await renderBookingPendingOwnerEmail({
            ownerLabel,
            userLabel,
            courtLabel,
            venueLabel,
            requesterEmailDisplay: requesterEmail ?? 'não informado',
            bookingId: booking.id,
            date: booking.date,
            startTime: booking.startTime,
            durationHours: booking.durationHours,
          });
          return this.emailSender!.sendEmail({
            to: ownerEmail,
            subject: `Nova reserva pendente em ${courtLabel}`,
            html,
            text,
            metadata: {
              bookingId: booking.id,
              courtId: booking.courtId,
              userId: booking.userId,
              recipientType: 'owner',
              bookingStatus: booking.status,
            },
            templateName: 'booking/pending-owner',
          });
        })(),
      );
    }

    if (!requesterPromises.length) return;
    await Promise.allSettled(requesterPromises);
  }
}
