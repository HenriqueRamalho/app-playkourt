import { NextRequest } from 'next/server';
import { withBackofficeAccess } from '@/infrastructure/middlewares/auth.middleware';
import { BackofficeController } from '@/infrastructure/controllers/backoffice.controller';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withBackofficeAccess(req, (req, actor) => BackofficeController.unbanUser(req, actor, id));
}
