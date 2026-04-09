import { NextRequest, NextResponse } from 'next/server';
import { CreateVenueUseCase } from '@/application/use-cases/venue/CreateVenueUseCase';
import { ListVenuesUseCase } from '@/application/use-cases/venue/ListVenuesUseCase';
import { UpdateVenueUseCase } from '@/application/use-cases/venue/UpdateVenueUseCase';
import { DeleteVenueUseCase } from '@/application/use-cases/venue/DeleteVenueUseCase';
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

  static async getById(_req: NextRequest, user: { id: string; email: string }, id: string): Promise<NextResponse> {
    try {
      const venueRepository = new SupabaseVenueRepository();
      const venue = await venueRepository.findById(id);

      if (!venue) return NextResponse.json({ error: 'Venue not found' }, { status: 404 });

      const member = await venueRepository.findByMemberId(user.id);
      const hasAccess = member.some((v) => v.id === id);
      if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      return NextResponse.json(venue);
    } catch (error) {
      console.error('Error fetching venue:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async update(req: NextRequest, user: { id: string; email: string }, id: string): Promise<NextResponse> {
    try {
      const venueRepository = new SupabaseVenueRepository();

      const members = await venueRepository.findByMemberId(user.id);
      const hasAccess = members.some((v) => v.id === id);
      if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const body = await req.json();
      const updateVenueUseCase = new UpdateVenueUseCase(venueRepository);
      const venue = await updateVenueUseCase.execute(id, body);
      return NextResponse.json(venue);
    } catch (error) {
      console.error('Error updating venue:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async delete(_req: NextRequest, user: { id: string; email: string }, id: string): Promise<NextResponse> {
    try {
      const venueRepository = new SupabaseVenueRepository();

      const members = await venueRepository.findByMemberId(user.id);
      const hasAccess = members.some((v) => v.id === id);
      if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const deleteVenueUseCase = new DeleteVenueUseCase(venueRepository);
      await deleteVenueUseCase.execute(id);
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error('Error deleting venue:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
}
