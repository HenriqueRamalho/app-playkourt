import { NextRequest, NextResponse } from 'next/server';
import type { AuthUser } from '@/infrastructure/frontend-services/auth/auth.service';
import { RegisterImageUseCase } from '@/application/use-cases/image/RegisterImageUseCase';
import { ListOwnerImagesUseCase } from '@/application/use-cases/image/ListOwnerImagesUseCase';
import { DeleteOwnerImageUseCase } from '@/application/use-cases/image/DeleteOwnerImageUseCase';
import { DrizzleImageRepository } from '@/infrastructure/repositories/drizzle/drizzle-image.repository';
import {
  assertValidImageRegistration,
  ImageUploadValidationError,
} from '@/infrastructure/services/storage/validate-registered-image';
import type { Image } from '@/domain/image/entity/image.interface';

function toImageResponse(image: Image) {
  return {
    id: image.id,
    ownerId: image.ownerId,
    storageKey: image.storageKey,
    publicUrl: image.publicUrl,
    mimeType: image.mimeType,
    sizeBytes: image.sizeBytes,
    originalName: image.originalName ?? null,
    createdAt: image.createdAt.toISOString(),
  };
}

export class ImageController {
  static async list(_req: NextRequest, user: AuthUser): Promise<NextResponse> {
    try {
      const repo = new DrizzleImageRepository();
      const list = await new ListOwnerImagesUseCase(repo).execute(user.id);
      return NextResponse.json({ images: list.map(toImageResponse) });
    } catch (error) {
      console.error('List images error:', error);
      return NextResponse.json({ error: 'Falha ao listar imagens.' }, { status: 500 });
    }
  }

  static async register(req: NextRequest, user: AuthUser): Promise<NextResponse> {
    try {
      const body = (await req.json()) as {
        storageKey?: unknown;
        publicUrl?: unknown;
        mimeType?: unknown;
        sizeBytes?: unknown;
        originalName?: unknown;
      };

      const storageKey = typeof body.storageKey === 'string' ? body.storageKey.trim() : '';
      const publicUrl = typeof body.publicUrl === 'string' ? body.publicUrl.trim() : '';
      const mimeType = typeof body.mimeType === 'string' ? body.mimeType.trim() : '';
      const sizeBytes =
        typeof body.sizeBytes === 'number' && Number.isFinite(body.sizeBytes)
          ? body.sizeBytes
          : typeof body.sizeBytes === 'string'
            ? Number.parseInt(body.sizeBytes, 10)
            : NaN;
      const originalName =
        typeof body.originalName === 'string' && body.originalName.trim() !== ''
          ? body.originalName.trim().slice(0, 500)
          : undefined;

      if (!storageKey || !publicUrl || !mimeType || !Number.isFinite(sizeBytes)) {
        return NextResponse.json({ error: 'Dados de imagem inválidos.' }, { status: 400 });
      }

      assertValidImageRegistration({
        userId: user.id,
        storageKey,
        publicUrl,
        mimeType,
        sizeBytes,
      });

      const repo = new DrizzleImageRepository();
      const image = await new RegisterImageUseCase(repo).execute({
        ownerId: user.id,
        storageKey,
        publicUrl,
        mimeType,
        sizeBytes,
        originalName,
      });
      return NextResponse.json({ image: toImageResponse(image) }, { status: 201 });
    } catch (error) {
      if (error instanceof ImageUploadValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error instanceof Error && error.message.includes('já está registrada')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      console.error('Register image error:', error);
      return NextResponse.json({ error: 'Falha ao registrar imagem.' }, { status: 500 });
    }
  }

  static async delete(
    _req: NextRequest,
    user: AuthUser,
    imageId: string,
  ): Promise<NextResponse> {
    try {
      const repo = new DrizzleImageRepository();
      const removed = await new DeleteOwnerImageUseCase(repo).execute(imageId, user.id);
      if (!removed) {
        return NextResponse.json({ error: 'Imagem não encontrada.' }, { status: 404 });
      }
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error('Delete image error:', error);
      return NextResponse.json({ error: 'Falha ao excluir imagem.' }, { status: 500 });
    }
  }
}
