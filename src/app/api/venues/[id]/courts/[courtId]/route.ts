import { NextRequest } from 'next/server';
import { withAuth } from '@/infrastructure/middlewares/auth.middleware';
import { CourtController } from '@/infrastructure/controllers/court.controller';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; courtId: string }> }) {
  const { id, courtId } = await params;
  return withAuth(req, (req, user) => CourtController.getById(req, user, id, courtId));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; courtId: string }> }) {
  const { id, courtId } = await params;
  return withAuth(req, (req, user) => CourtController.update(req, user, id, courtId));
}
