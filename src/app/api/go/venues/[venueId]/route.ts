import { NextRequest, NextResponse } from 'next/server';
import { DrizzleVenueRepository } from '@/infrastructure/repositories/drizzle/drizzle-venue.repository';
import { DrizzleCourtRepository } from '@/infrastructure/repositories/drizzle/drizzle-court.repository';
import { DrizzleVenueImageRepository } from '@/infrastructure/repositories/drizzle/drizzle-venue-image.repository';
import { ListVenueImagesUseCase } from '@/application/use-cases/venue-image/ListVenueImagesUseCase';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ venueId: string }> }) {
  try {
    const { venueId } = await params;
    const venueRepository = new DrizzleVenueRepository();
    const courtRepository = new DrizzleCourtRepository();

    const venue = await venueRepository.findById(venueId);
    if (!venue) return NextResponse.json({ error: 'Venue not found' }, { status: 404 });

    const courts = await courtRepository.findByVenueId(venueId);
    const activeCourts = courts.filter((c) => c.isActive);

    const venueImageRepo = new DrizzleVenueImageRepository();
    const venueImages = await new ListVenueImagesUseCase(venueImageRepo).execute(venueId);
    const images = venueImages.map((vi) => ({
      publicUrl: vi.publicUrl,
      originalName: vi.originalName ?? null,
    }));

    return NextResponse.json({ venue, courts: activeCourts, images });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
