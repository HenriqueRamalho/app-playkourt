import { NextRequest, NextResponse } from 'next/server';
import { SupabaseCourtRepository } from '@/infrastructure/repositories/supabase/supabase-court.repository';
import { SearchAvailableCourtsUseCase } from '@/application/use-cases/court/SearchAvailableCourtsUseCase';
import { SportType } from '@/domain/court/entity/court.interface';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cityId = Number(searchParams.get('cityId'));
    const sportType = searchParams.get('sportType') as SportType;
    const date = searchParams.get('date') ?? '';
    const startTime = searchParams.get('startTime') ?? '';
    const endTime = searchParams.get('endTime') ?? '';

    const courtRepository = new SupabaseCourtRepository();
    const useCase = new SearchAvailableCourtsUseCase(courtRepository);
    const results = await useCase.execute({ cityId, sportType, date, startTime, endTime });

    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
