import { NextRequest, NextResponse } from 'next/server';
import { SearchCourtsUseCase } from '@/application/use-cases/court/SearchCourtsUseCase';
import { CreateBookingUseCase } from '@/application/use-cases/booking/CreateBookingUseCase';
import { ListUserBookingsUseCase } from '@/application/use-cases/booking/ListUserBookingsUseCase';
import { SupabaseCourtRepository } from '@/infrastructure/repositories/supabase/supabase-court.repository';
import { SupabaseBookingRepository } from '@/infrastructure/repositories/supabase/supabase-booking.repository';
import { SupabaseVenueRepository } from '@/infrastructure/repositories/supabase/supabase-venue.repository';
import { SportType } from '@/domain/court/entity/court.interface';

export class GoController {
  static async searchCourts(req: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(req.url);
      const cityId = Number(searchParams.get('cityId'));
      const neighborhood = searchParams.get('neighborhood') ?? undefined;
      const sportType = (searchParams.get('sportType') as SportType) ?? undefined;

      if (!cityId) return NextResponse.json({ error: 'cityId is required' }, { status: 400 });

      const courtRepository = new SupabaseCourtRepository();
      const useCase = new SearchCourtsUseCase(courtRepository);
      const courts = await useCase.execute({ cityId, neighborhood, sportType });
      return NextResponse.json(courts);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async listMyBookings(_req: NextRequest, user: { id: string; email: string }): Promise<NextResponse> {
    try {
      const bookingRepository = new SupabaseBookingRepository();
      const useCase = new ListUserBookingsUseCase(bookingRepository);
      const bookings = await useCase.execute(user.id);
      return NextResponse.json(bookings);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async createBooking(req: NextRequest, user: { id: string; email: string }): Promise<NextResponse> {
    try {
      const body = await req.json();
      const courtRepository = new SupabaseCourtRepository();
      const venueRepository = new SupabaseVenueRepository();

      const court = await courtRepository.findById(body.courtId);
      if (!court) return NextResponse.json({ error: 'Court not found' }, { status: 404 });

      const venue = await venueRepository.findById(court.venueId);
      if (!venue) return NextResponse.json({ error: 'Venue not found' }, { status: 404 });

      const businessHours = court.businessHours ?? venue.businessHours ?? [];

      const bookingRepository = new SupabaseBookingRepository();
      const useCase = new CreateBookingUseCase(bookingRepository);
      const booking = await useCase.execute({ ...body, userId: user.id, businessHours, isCourtActive: court.isActive });
      return NextResponse.json(booking, { status: 201 });
    } catch (error) {
      const isConflict = error instanceof Error &&
        (error.message.includes('no_overlapping_bookings') || error.message.includes('já está reservado'));
      const status = isConflict ? 409 : 400;
      const message = isConflict
        ? 'Este horário já está reservado. Por favor, escolha outro horário.'
        : error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: message }, { status });
    }
  }
}
