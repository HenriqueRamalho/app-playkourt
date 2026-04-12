import { NextRequest } from 'next/server';
import { GoController } from '@/infrastructure/controllers/go.controller';

export async function GET(req: NextRequest) {
  return GoController.searchCourts(req);
}
