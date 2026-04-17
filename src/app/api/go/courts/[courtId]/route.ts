import { NextRequest, NextResponse } from 'next/server';
import { SupabaseCourtRepository } from '@/infrastructure/repositories/supabase/supabase-court.repository';
import { SupabaseVenueRepository } from '@/infrastructure/repositories/supabase/supabase-venue.repository';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ courtId: string }> }) {
  try {
    const { courtId } = await params;
    const courtRepository = new SupabaseCourtRepository();
    const venueRepository = new SupabaseVenueRepository();

    const court = await courtRepository.findById(courtId);
    if (!court) return NextResponse.json({ error: 'Court not found' }, { status: 404 });

    const venue = await venueRepository.findById(court.venueId);
    if (!venue) return NextResponse.json({ error: 'Venue not found' }, { status: 404 });

    const courtWithSchedule = await courtRepository.findByIdWithSchedule(courtId, venue.businessHours);
    if (!courtWithSchedule) return NextResponse.json({ error: 'Court not found' }, { status: 404 });

    return NextResponse.json({
      ...courtWithSchedule,
      venueName: venue.name,
      neighborhood: venue.neighborhood ?? '',
      cityName: venue.cityName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
