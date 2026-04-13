import { NextRequest, NextResponse } from 'next/server';
import { SupabaseVenueRepository } from '@/infrastructure/repositories/supabase/supabase-venue.repository';
import { SupabaseCourtRepository } from '@/infrastructure/repositories/supabase/supabase-court.repository';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ venueId: string }> }) {
  try {
    const { venueId } = await params;
    const venueRepository = new SupabaseVenueRepository();
    const courtRepository = new SupabaseCourtRepository();

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
