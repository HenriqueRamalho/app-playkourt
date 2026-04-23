import { NextRequest } from 'next/server';
import { withAuth } from '@/infrastructure/middlewares/auth.middleware';
import { ImageController } from '@/infrastructure/controllers/image.controller';

export async function GET(req: NextRequest) {
  return withAuth(req, (r, user) => ImageController.list(r, user));
}

export async function POST(req: NextRequest) {
  return withAuth(req, (r, user) => ImageController.register(r, user));
}
