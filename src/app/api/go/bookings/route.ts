import { NextRequest } from 'next/server';
import { withAuth } from '@/infrastructure/middlewares/auth.middleware';
import { GoController } from '@/infrastructure/controllers/go.controller';

export async function GET(req: NextRequest) {
  return withAuth(req, (req, user) => GoController.listMyBookings(req, user));
}

export async function POST(req: NextRequest) {
  return withAuth(req, (req, user) => GoController.createBooking(req, user));
}
