import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/infrastructure/middlewares/auth.middleware';
import { VenueAccessService } from '@/infrastructure/services/venue-access.service';
import { SupabaseCourtRepository } from '@/infrastructure/repositories/supabase/supabase-court.repository';
import { SupabaseBookingRepository } from '@/infrastructure/repositories/supabase/supabase-booking.repository';

type Params = Promise<{ id: string; courtId: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  return withAuth(req, async (req, user) => {
    const { id: venueId, courtId } = await params;

    if (!await VenueAccessService.hasAccess(user.id, venueId))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
      const body = await req.json();
      const courtRepository = new SupabaseCourtRepository();

      const court = await courtRepository.findById(courtId);
      if (!court) return NextResponse.json({ error: 'Court not found' }, { status: 404 });

      // Cenário 5: alerta de agendamentos em datas que serão bloqueadas
      const newExceptions = body.dateExceptions ?? [];
      const fullBlockDates = newExceptions
        .filter((e: { isFullDayBlock: boolean }) => e.isFullDayBlock)
        .map((e: { date: string }) => e.date);

      const bookingRepository = new SupabaseBookingRepository();
      const affectedBookings: { date: string; count: number }[] = [];
      for (const date of fullBlockDates) {
        const bookings = await bookingRepository.findActiveByCourtAndDate(courtId, date);
        if (bookings.length > 0) affectedBookings.push({ date, count: bookings.length });
      }

      // Atualiza use_venue_hours na court
      await courtRepository.update(courtId, { useVenueHours: body.useVenueHours });

      // Persiste nas tabelas normalizadas
      await courtRepository.updateSchedule(
        courtId,
        body.useVenueHours ? [] : (body.businessHours ?? []),
        body.dateExceptions ?? [],
        body.recurringBlocks ?? [],
      );

      const updated = await courtRepository.findById(courtId);
      return NextResponse.json({ court: updated, affectedBookings });
    } catch (error) {
      console.error('PATCH schedule error:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
