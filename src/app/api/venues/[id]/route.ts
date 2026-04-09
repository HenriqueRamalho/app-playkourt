import { NextRequest } from 'next/server';
import { withAuth } from '@/infrastructure/middlewares/auth.middleware';
import { VenueController } from '@/infrastructure/controllers/venue.controller';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(req, (req, user) => VenueController.getById(req, user, id));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(req, (req, user) => VenueController.update(req, user, id));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(req, (req, user) => VenueController.delete(req, user, id));
}
