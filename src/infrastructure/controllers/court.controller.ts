import { NextRequest, NextResponse } from 'next/server';
import { CreateCourtUseCase } from '@/application/use-cases/court/CreateCourtUseCase';
import { ListCourtsUseCase } from '@/application/use-cases/court/ListCourtsUseCase';
import { UpdateCourtUseCase } from '@/application/use-cases/court/UpdateCourtUseCase';
import { DeleteCourtUseCase } from '@/application/use-cases/court/DeleteCourtUseCase';
import { DrizzleCourtRepository } from '@/infrastructure/repositories/drizzle/drizzle-court.repository';
import { VenueAccessService } from '@/infrastructure/services/venue-access.service';

export class CourtController {
  static async create(req: NextRequest, user: { id: string; email: string }, venueId: string): Promise<NextResponse> {
    try {
      if (!await VenueAccessService.hasAccess(user.id, venueId))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const body = await req.json();
      const courtRepository = new DrizzleCourtRepository();
      const court = await new CreateCourtUseCase(courtRepository).execute({ ...body, venueId });
      return NextResponse.json(court, { status: 201 });
    } catch (error) {
      console.error('Error creating court:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async list(_req: NextRequest, user: { id: string; email: string }, venueId: string): Promise<NextResponse> {
    try {
      if (!await VenueAccessService.hasAccess(user.id, venueId))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const courtRepository = new DrizzleCourtRepository();
      const courts = await new ListCourtsUseCase(courtRepository).execute(venueId);
      return NextResponse.json(courts);
    } catch (error) {
      console.error('Error listing courts:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async getById(_req: NextRequest, user: { id: string; email: string }, venueId: string, courtId: string): Promise<NextResponse> {
    try {
      if (!await VenueAccessService.hasAccess(user.id, venueId))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const courtRepository = new DrizzleCourtRepository();
      const court = await courtRepository.findById(courtId);
      if (!court) return NextResponse.json({ error: 'Court not found' }, { status: 404 });

      const schedule = await courtRepository.loadSchedule(courtId);

      return NextResponse.json({ ...court, ...schedule });
    } catch (error) {
      console.error('Error fetching court:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async update(req: NextRequest, user: { id: string; email: string }, venueId: string, courtId: string): Promise<NextResponse> {
    try {
      if (!await VenueAccessService.hasAccess(user.id, venueId))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const body = await req.json();
      const courtRepository = new DrizzleCourtRepository();
      const court = await new UpdateCourtUseCase(courtRepository).execute(courtId, body);
      return NextResponse.json(court);
    } catch (error) {
      console.error('Error updating court:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async delete(_req: NextRequest, user: { id: string; email: string }, venueId: string, courtId: string): Promise<NextResponse> {
    try {
      if (!await VenueAccessService.hasAccess(user.id, venueId))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const courtRepository = new DrizzleCourtRepository();
      await new DeleteCourtUseCase(courtRepository).execute(courtId);
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error('Error deleting court:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
}
