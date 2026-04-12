import { NextRequest } from 'next/server';
import { withAuth } from '@/infrastructure/middlewares/auth.middleware';
import { AdminBookingController } from '@/infrastructure/controllers/admin-booking.controller';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(req, (req, user) => AdminBookingController.list(req, user, id));
}
