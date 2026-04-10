import { NextRequest } from 'next/server';
import { LocationController } from '@/infrastructure/controllers/location.controller';

export async function GET(req: NextRequest) {
  return LocationController.listStates(req);
}
