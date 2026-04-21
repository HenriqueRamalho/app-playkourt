import { Booking, BookingStatus } from '@/domain/booking/entity/booking.interface';
import {
  BookingRepositoryInterface,
  BookingWithDetails,
} from '@/domain/booking/repository/booking-repository.interface';
import { EmailSender } from '@/domain/email/service/email-sender.interface';
import { UserRepositoryInterface } from '@/domain/user/repository/user-repository.interface';
import { renderBookingStatusNoticeEmail } from '@/infrastructure/services/email/react-email/render-booking-emails';
import type { BookingStatusNoticeKind } from '@/infrastructure/services/email/react-email/templates/booking-status-notice';

const BOOKER_NOTICE_STATUSES = new Set<BookingStatus>([
  BookingStatus.CONFIRMED,
  BookingStatus.CANCELLED,
]);

export class UpdateBookingStatusUseCase {
  constructor(
    private bookingRepository: BookingRepositoryInterface,
    private emailSender?: EmailSender,
    private userRepository?: UserRepositoryInterface,
  ) {}

  async execute(id: string, status: BookingStatus): Promise<Booking> {
    const before = await this.bookingRepository.findById(id);
    if (!before) throw new Error('Booking not found');
    if (before.status === BookingStatus.CANCELLED) {
      throw new Error('Cannot update a cancelled booking');
    }

    const updated = await this.bookingRepository.updateStatus(id, status);
    await this.notifyBookerStatusChange(before, status);
    return updated;
  }

  private async notifyBookerStatusChange(
    before: BookingWithDetails,
    newStatus: BookingStatus,
  ): Promise<void> {
    if (!this.emailSender || !this.userRepository) return;
    if (before.status === newStatus) return;
    if (!BOOKER_NOTICE_STATUSES.has(newStatus)) return;

    const user = await this.userRepository.findById(before.userId);
    const email = user?.email?.trim().toLowerCase();
    if (!email) return;

    const noticeStatus: BookingStatusNoticeKind =
      newStatus === BookingStatus.CONFIRMED ? 'confirmed' : 'cancelled';

    const userLabel = user?.name?.trim() || 'Cliente';
    const courtLabel = before.courtName?.trim() || 'Quadra';
    const venueLabel = before.venueName?.trim() || 'Arena';

    try {
      const { html, text } = await renderBookingStatusNoticeEmail({
        userLabel,
        courtLabel,
        venueLabel,
        bookingId: before.id,
        date: before.date,
        startTime: before.startTime,
        durationHours: before.durationHours,
        status: noticeStatus,
      });

      const subject =
        noticeStatus === 'confirmed'
          ? `Reserva confirmada: ${courtLabel}`
          : `Reserva cancelada: ${courtLabel}`;

      await this.emailSender.sendEmail({
        to: email,
        recipientUserId: before.userId,
        subject,
        html,
        text,
        metadata: {
          bookingId: before.id,
          courtId: before.courtId,
          recipientType: 'booker_status_notice',
          bookingStatus: newStatus,
        },
        templateName:
          noticeStatus === 'confirmed' ? 'booking/status-confirmed' : 'booking/status-cancelled',
      });
    } catch {
      // Não falha o fluxo de negócio se render ou envio falhar
    }
  }
}
