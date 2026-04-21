import { NextRequest } from 'next/server';
import { AccountController } from '@/infrastructure/controllers/account.controller';
import { withAuth } from '@/infrastructure/middlewares/auth.middleware';

export async function POST(req: NextRequest) {
  return withAuth(req, (r, user) => AccountController.setInitialPassword(r, user));
}
