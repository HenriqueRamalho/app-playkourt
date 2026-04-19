import { NextRequest } from 'next/server';
import { withBackofficeAccess } from '@/infrastructure/middlewares/auth.middleware';
import { BackofficeController } from '@/infrastructure/controllers/backoffice.controller';

export async function GET(req: NextRequest) {
  return withBackofficeAccess(req, (req) => BackofficeController.listUsers(req));
}
