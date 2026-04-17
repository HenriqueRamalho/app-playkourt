import { NextRequest, NextResponse } from 'next/server';
import { DrizzleVenueRepository } from '@/infrastructure/repositories/drizzle/drizzle-venue.repository';
import { DrizzleCourtRepository } from '@/infrastructure/repositories/drizzle/drizzle-court.repository';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ venueId: string }> }) {
  try {
    const { venueId } = await params;
    const venueRepository = new DrizzleVenueRepository();
    const courtRepository = new DrizzleCourtRepository();

    const venue = await venueRepository.findById(venueId);
    if (!venue) return NextResponse.json({ error: 'Venue not found' }, { status: 404 });

    const courts = await courtRepository.findByVenueId(venueId);
    const activeCourts = courts.filter((c) => c.isActive);

    return NextResponse.json({ venue, courts: activeCourts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
