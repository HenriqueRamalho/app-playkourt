import { NextRequest, NextResponse } from 'next/server';
import { CreateVenueUseCase } from '@/application/use-cases/venue/CreateVenueUseCase';
import { ListVenuesUseCase } from '@/application/use-cases/venue/ListVenuesUseCase';
import { SupabaseVenueRepository } from '@/infrastructure/repositories/supabase/supabase-venue.repository';

export class VenueController {
  static async create(req: NextRequest, user: { id: string; email: string }): Promise<NextResponse> {
    try {
      const body = await req.json();
      const venueRepository = new SupabaseVenueRepository();
      const createVenueUseCase = new CreateVenueUseCase(venueRepository);

      const venue = await createVenueUseCase.execute({ ...body, ownerId: user.id });
      return NextResponse.json(venue, { status: 201 });
    } catch (error) {
      console.error('Error creating venue:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async list(_req: NextRequest, user: { id: string; email: string }): Promise<NextResponse> {
    try {
      const venueRepository = new SupabaseVenueRepository();
      const listVenuesUseCase = new ListVenuesUseCase(venueRepository);

      const venues = await listVenuesUseCase.execute(user.id);
      return NextResponse.json(venues);
    } catch (error) {
      console.error('Error listing venues:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
}
