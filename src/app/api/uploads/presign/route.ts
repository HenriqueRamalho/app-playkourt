import { NextRequest } from 'next/server';
import { withAuth } from '@/infrastructure/middlewares/auth.middleware';
import { UploadController } from '@/infrastructure/controllers/upload.controller';

/** Gera presigned PUT para envio direto ao S3; leitura pública via CloudFront (ver README). */
export async function POST(req: NextRequest) {
  return withAuth(req, (r, user) => UploadController.presignImage(r, user));
}
