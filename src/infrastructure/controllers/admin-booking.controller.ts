import { NextRequest, NextResponse } from 'next/server';
import { ListVenueBookingsUseCase } from '@/application/use-cases/booking/ListVenueBookingsUseCase';
import { UpdateBookingStatusUseCase } from '@/application/use-cases/booking/UpdateBookingStatusUseCase';
import { DrizzleBookingRepository } from '@/infrastructure/repositories/drizzle/drizzle-booking.repository';
import { VenueAccessService } from '@/infrastructure/services/venue-access.service';
import { BookingStatus } from '@/domain/booking/entity/booking.interface';

export class AdminBookingController {
  static async list(req: NextRequest, user: { id: string; email: string }, venueId: string): Promise<NextResponse> {
    try {
      if (!await VenueAccessService.hasAccess(user.id, venueId))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const { searchParams } = new URL(req.url);
      const page = Math.max(1, Number(searchParams.get('page') ?? 1));
      const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') ?? 20)));

      const bookingRepository = new DrizzleBookingRepository();
      const result = await new ListVenueBookingsUseCase(bookingRepository).execute(venueId, page, pageSize);
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async getById(_req: NextRequest, user: { id: string; email: string }, venueId: string, bookingId: string): Promise<NextResponse> {
    try {
      if (!await VenueAccessService.hasAccess(user.id, venueId))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const bookingRepository = new DrizzleBookingRepository();
      const booking = await bookingRepository.findById(bookingId);
      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      return NextResponse.json(booking);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async updateStatus(req: NextRequest, user: { id: string; email: string }, venueId: string, bookingId: string): Promise<NextResponse> {
    try {
      if (!await VenueAccessService.hasAccess(user.id, venueId))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const { status } = await req.json();
      if (!Object.values(BookingStatus).includes(status))
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

      const bookingRepository = new DrizzleBookingRepository();
      const booking = await new UpdateBookingStatusUseCase(bookingRepository).execute(bookingId, status);
      return NextResponse.json(booking);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }
}
