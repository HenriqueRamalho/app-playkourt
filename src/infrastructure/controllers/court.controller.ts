import { NextRequest, NextResponse } from 'next/server';
import { CreateCourtUseCase } from '@/application/use-cases/court/CreateCourtUseCase';
import { ListCourtsUseCase } from '@/application/use-cases/court/ListCourtsUseCase';
import { UpdateCourtUseCase } from '@/application/use-cases/court/UpdateCourtUseCase';
import { SupabaseCourtRepository } from '@/infrastructure/repositories/supabase/supabase-court.repository';
import { SupabaseVenueRepository } from '@/infrastructure/repositories/supabase/supabase-venue.repository';

export class CourtController {
  static async create(req: NextRequest, user: { id: string; email: string }, venueId: string): Promise<NextResponse> {
    try {
      const venueRepository = new SupabaseVenueRepository();
      const members = await venueRepository.findByMemberId(user.id);
      const hasAccess = members.some((v) => v.id === venueId);
      if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const body = await req.json();
      const courtRepository = new SupabaseCourtRepository();
      const createCourtUseCase = new CreateCourtUseCase(courtRepository);
      const court = await createCourtUseCase.execute({ ...body, venueId });
      return NextResponse.json(court, { status: 201 });
    } catch (error) {
      console.error('Error creating court:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async list(_req: NextRequest, user: { id: string; email: string }, venueId: string): Promise<NextResponse> {
    try {
      const venueRepository = new SupabaseVenueRepository();
      const members = await venueRepository.findByMemberId(user.id);
      const hasAccess = members.some((v) => v.id === venueId);
      if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const courtRepository = new SupabaseCourtRepository();
      const listCourtsUseCase = new ListCourtsUseCase(courtRepository);
      const courts = await listCourtsUseCase.execute(venueId);
      return NextResponse.json(courts);
    } catch (error) {
      console.error('Error listing courts:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async getById(_req: NextRequest, user: { id: string; email: string }, venueId: string, courtId: string): Promise<NextResponse> {
    try {
      const venueRepository = new SupabaseVenueRepository();
      const members = await venueRepository.findByMemberId(user.id);
      const hasAccess = members.some((v) => v.id === venueId);
      if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const courtRepository = new SupabaseCourtRepository();
      const court = await courtRepository.findById(courtId);
      if (!court) return NextResponse.json({ error: 'Court not found' }, { status: 404 });

      return NextResponse.json(court);
    } catch (error) {
      console.error('Error fetching court:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async update(req: NextRequest, user: { id: string; email: string }, venueId: string, courtId: string): Promise<NextResponse> {
    try {
      const venueRepository = new SupabaseVenueRepository();
      const members = await venueRepository.findByMemberId(user.id);
      const hasAccess = members.some((v) => v.id === venueId);
      if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const body = await req.json();
      const courtRepository = new SupabaseCourtRepository();
      const updateCourtUseCase = new UpdateCourtUseCase(courtRepository);
      const court = await updateCourtUseCase.execute(courtId, body);
      return NextResponse.json(court);
    } catch (error) {
      console.error('Error updating court:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
}
