import { NextRequest, NextResponse } from 'next/server';
import { DrizzleCourtRepository } from '@/infrastructure/repositories/drizzle/drizzle-court.repository';
import { DrizzleVenueRepository } from '@/infrastructure/repositories/drizzle/drizzle-venue.repository';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ courtId: string }> }) {
  try {
    const { courtId } = await params;
    const courtRepository = new DrizzleCourtRepository();
    const venueRepository = new DrizzleVenueRepository();

    const court = await courtRepository.findById(courtId);
    if (!court) return NextResponse.json({ error: 'Court not found' }, { status: 404 });

    const venue = await venueRepository.findById(court.venueId);
    if (!venue) return NextResponse.json({ error: 'Venue not found' }, { status: 404 });

    const courtWithSchedule = await courtRepository.findByIdWithSchedule(courtId, venue.businessHours ?? []);
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
