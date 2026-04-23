import { NextRequest } from 'next/server';
import { withAuth } from '@/infrastructure/middlewares/auth.middleware';
import { ImageController } from '@/infrastructure/controllers/image.controller';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAuth(req, (r, user) => ImageController.delete(r, user, id));
}
