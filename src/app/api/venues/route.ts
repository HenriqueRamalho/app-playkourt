import { NextRequest } from 'next/server';
import { withAuth } from '@/infrastructure/middlewares/auth.middleware';
import { VenueController } from '@/infrastructure/controllers/venue.controller';

export async function GET(req: NextRequest) {
  return withAuth(req, (req, user) => VenueController.list(req, user));
}

export async function POST(req: NextRequest) {
  return withAuth(req, (req, user) => VenueController.create(req, user));
}
