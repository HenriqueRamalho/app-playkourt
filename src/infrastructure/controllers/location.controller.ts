import { NextRequest, NextResponse } from 'next/server';
import { ListStatesUseCase } from '@/application/use-cases/location/ListStatesUseCase';
import { ListCitiesByStateUseCase } from '@/application/use-cases/location/ListCitiesByStateUseCase';
import { SupabaseLocationRepository } from '@/infrastructure/repositories/supabase/supabase-location.repository';

export class LocationController {
  static async listStates(_req: NextRequest): Promise<NextResponse> {
    try {
      const repo = new SupabaseLocationRepository();
      const states = await new ListStatesUseCase(repo).execute();
      return NextResponse.json(states);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  static async listCities(_req: NextRequest, stateId: number): Promise<NextResponse> {
    try {
      const repo = new SupabaseLocationRepository();
      const cities = await new ListCitiesByStateUseCase(repo).execute(stateId);
      return NextResponse.json(cities);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
}
