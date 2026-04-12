import { NextRequest } from 'next/server';
import { withAuth } from '@/infrastructure/middlewares/auth.middleware';
import { AdminBookingController } from '@/infrastructure/controllers/admin-booking.controller';

type Params = Promise<{ id: string; reservationId: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { id, reservationId } = await params;
  return withAuth(req, (req, user) => AdminBookingController.getById(req, user, id, reservationId));
}

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { id, reservationId } = await params;
  return withAuth(req, (req, user) => AdminBookingController.updateStatus(req, user, id, reservationId));
}
