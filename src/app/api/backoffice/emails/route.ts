import { NextRequest } from 'next/server';
import { withBackofficeAccess } from '@/infrastructure/middlewares/auth.middleware';
import { BackofficeEmailController } from '@/infrastructure/controllers/backoffice-email.controller';

export async function GET(req: NextRequest) {
  return withBackofficeAccess(req, (req) => BackofficeEmailController.list(req));
}
