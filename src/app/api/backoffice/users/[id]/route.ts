import { NextRequest } from 'next/server';
import { withBackofficeAccess } from '@/infrastructure/middlewares/auth.middleware';
import { BackofficeController } from '@/infrastructure/controllers/backoffice.controller';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withBackofficeAccess(req, (req) => BackofficeController.getUserOverview(req, id));
}
