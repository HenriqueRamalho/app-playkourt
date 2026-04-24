import { NextRequest, NextResponse } from 'next/server';
import { CreateVenueUseCase } from '@/application/use-cases/venue/CreateVenueUseCase';
import { ListVenuesUseCase } from '@/application/use-cases/venue/ListVenuesUseCase';
import { UpdateVenueUseCase } from '@/application/use-cases/venue/UpdateVenueUseCase';
import { DeleteVenueUseCase } from '@/application/use-cases/venue/DeleteVenueUseCase';
import { DrizzleVenueRepository } from '@/infrastructure/repositories/drizzle/drizzle-venue.repository';
import { VenueAccessService } from '@/infrastructure/services/venue-access.service';

/** Converte o valor vindo do body para `number | null`. Strings vazias e 0 tornam-se null. */
function parseMinLead(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

export class VenueController {
  static async create(req: NextRequest, user: { id: string; email: string }): Promise<NextResponse> {
    try {
      const body = await req.json();
      const minLead = parseMinLead(body.minBookingLeadMinutes);
      const venueRepository = new DrizzleVenueRepository();
      const venue = await new CreateVenueUseCase(venueRepository).execute({
        ...body,
        ownerId: user.id,
        minBookingLeadMinutes: minLead,
      });
      return NextResponse.json(venue, { status: 201 });
    } catch (error) {
      console.error('Error creating venue:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async list(_req: NextRequest, user: { id: string; email: string }): Promise<NextResponse> {
    try {
      const venueRepository = new DrizzleVenueRepository();
      const venues = await new ListVenuesUseCase(venueRepository).execute(user.id);
      return NextResponse.json(venues);
    } catch (error) {
      console.error('Error listing venues:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async getById(_req: NextRequest, user: { id: string; email: string }, id: string): Promise<NextResponse> {
    try {
      if (!await VenueAccessService.hasAccess(user.id, id))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const venueRepository = new DrizzleVenueRepository();
      const venue = await venueRepository.findById(id);
      if (!venue) return NextResponse.json({ error: 'Venue not found' }, { status: 404 });

      return NextResponse.json(venue);
    } catch (error) {
      console.error('Error fetching venue:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async update(req: NextRequest, user: { id: string; email: string }, id: string): Promise<NextResponse> {
    try {
      if (!await VenueAccessService.hasAccess(user.id, id))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const body = await req.json();
      const update = { ...body };
      if ('minBookingLeadMinutes' in update) update.minBookingLeadMinutes = parseMinLead(update.minBookingLeadMinutes);
      const venueRepository = new DrizzleVenueRepository();
      const venue = await new UpdateVenueUseCase(venueRepository).execute(id, update);
      return NextResponse.json(venue);
    } catch (error) {
      console.error('Error updating venue:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async delete(_req: NextRequest, user: { id: string; email: string }, id: string): Promise<NextResponse> {
    try {
      if (!await VenueAccessService.hasAccess(user.id, id))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const venueRepository = new DrizzleVenueRepository();
      await new DeleteVenueUseCase(venueRepository).execute(id);
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error('Error deleting venue:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
}
