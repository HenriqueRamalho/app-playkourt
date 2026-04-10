import { NextRequest } from 'next/server';
import { LocationController } from '@/infrastructure/controllers/location.controller';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return LocationController.listCities(req, Number(id));
}
