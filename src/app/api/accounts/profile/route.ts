import { NextRequest } from 'next/server';
import { withAuth } from '@/infrastructure/middlewares/auth.middleware';
import { AccountController } from '@/infrastructure/controllers/account.controller';

export async function PATCH(req: NextRequest) {
  return withAuth(req, (req, user) => AccountController.updateProfile(req, user));
}
