import { NextRequest } from 'next/server';
import { withBackofficeAccess } from '@/infrastructure/middlewares/auth.middleware';
import { BackofficeEmailController } from '@/infrastructure/controllers/backoffice-email.controller';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBackofficeAccess(req, (req, actor) =>
    BackofficeEmailController.resend(req, actor, id),
  );
}
