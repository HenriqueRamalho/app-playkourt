import { NextRequest, NextResponse } from 'next/server';
import type { AuthUser } from '@/infrastructure/frontend-services/auth/auth.service';
import {
  createPresignedImageUpload,
  StorageConfigError,
  StorageValidationError,
} from '@/infrastructure/services/storage/s3-presigned-upload.service';

export class UploadController {
  static async presignImage(req: NextRequest, user: AuthUser): Promise<NextResponse> {
    try {
      const body = (await req.json()) as { contentType?: unknown; contentLength?: unknown };
      const contentType = typeof body.contentType === 'string' ? body.contentType : '';
      const contentLength =
        typeof body.contentLength === 'number'
          ? body.contentLength
          : typeof body.contentLength === 'string'
            ? Number.parseInt(body.contentLength, 10)
            : NaN;

      const result = await createPresignedImageUpload({
        userId: user.id,
        contentType,
        contentLength,
      });
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof StorageValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error instanceof StorageConfigError) {
        return NextResponse.json({ error: error.message }, { status: 503 });
      }
      console.error('Upload presign error:', error);
      return NextResponse.json({ error: 'Falha ao gerar URL de upload.' }, { status: 500 });
    }
  }
}
