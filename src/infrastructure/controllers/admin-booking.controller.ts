import { NextRequest, NextResponse } from 'next/server';
import { ListVenueBookingsUseCase } from '@/application/use-cases/booking/ListVenueBookingsUseCase';
import { UpdateBookingStatusUseCase } from '@/application/use-cases/booking/UpdateBookingStatusUseCase';
import { SupabaseBookingRepository } from '@/infrastructure/repositories/supabase/supabase-booking.repository';
import { SupabaseVenueRepository } from '@/infrastructure/repositories/supabase/supabase-venue.repository';
import { BookingStatus } from '@/domain/booking/entity/booking.interface';

async function assertVenueAccess(venueId: string, userId: string): Promise<boolean> {
  const venueRepository = new SupabaseVenueRepository();
  const members = await venueRepository.findByMemberId(userId);
  return members.some((v) => v.id === venueId);
}

export class AdminBookingController {
  static async list(req: NextRequest, user: { id: string; email: string }, venueId: string): Promise<NextResponse> {
    try {
      const hasAccess = await assertVenueAccess(venueId, user.id);
      if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const { searchParams } = new URL(req.url);
      const page = Math.max(1, Number(searchParams.get('page') ?? 1));
      const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') ?? 20)));

      const bookingRepository = new SupabaseBookingRepository();
      const useCase = new ListVenueBookingsUseCase(bookingRepository);
      const result = await useCase.execute(venueId, page, pageSize);
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async getById(_req: NextRequest, user: { id: string; email: string }, venueId: string, bookingId: string): Promise<NextResponse> {
    try {
      const hasAccess = await assertVenueAccess(venueId, user.id);
      if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const bookingRepository = new SupabaseBookingRepository();
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
      const hasAccess = await assertVenueAccess(venueId, user.id);
      if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const { status } = await req.json();
      if (!Object.values(BookingStatus).includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      const bookingRepository = new SupabaseBookingRepository();
      const useCase = new UpdateBookingStatusUseCase(bookingRepository);
      const booking = await useCase.execute(bookingId, status);
      return NextResponse.json(booking);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }
}
