import { NextRequest, NextResponse } from 'next/server';
import type { AuthUser } from '@/infrastructure/frontend-services/auth/auth.service';
import { DrizzleVenueImageRepository } from '@/infrastructure/repositories/drizzle/drizzle-venue-image.repository';
import { DrizzleImageRepository } from '@/infrastructure/repositories/drizzle/drizzle-image.repository';
import { ListVenueImagesUseCase } from '@/application/use-cases/venue-image/ListVenueImagesUseCase';
import {
  AttachImageToVenueUseCase,
  AttachImageToVenueError,
} from '@/application/use-cases/venue-image/AttachImageToVenueUseCase';
import { DetachVenueImageUseCase } from '@/application/use-cases/venue-image/DetachVenueImageUseCase';
import {
  ReorderVenueImagesUseCase,
  ReorderVenueImagesError,
} from '@/application/use-cases/venue-image/ReorderVenueImagesUseCase';
import type { VenueImage } from '@/domain/venue-image/entity/venue-image.interface';

function toDTO(vi: VenueImage) {
  return {
    id: vi.id,
    venueId: vi.venueId,
    imageId: vi.imageId,
    sortOrder: vi.sortOrder,
    publicUrl: vi.publicUrl,
    mimeType: vi.mimeType,
    sizeBytes: vi.sizeBytes,
    originalName: vi.originalName ?? null,
    createdAt: vi.createdAt.toISOString(),
  };
}

export class VenueImageController {
  static async list(_req: NextRequest, _user: AuthUser, venueId: string): Promise<NextResponse> {
    try {
      const repo = new DrizzleVenueImageRepository();
      const items = await new ListVenueImagesUseCase(repo).execute(venueId);
      return NextResponse.json({ images: items.map(toDTO) });
    } catch {
      return NextResponse.json({ error: 'Falha ao listar fotos.' }, { status: 500 });
    }
  }

  static async attach(req: NextRequest, user: AuthUser, venueId: string): Promise<NextResponse> {
    try {
      const body = (await req.json()) as { imageId?: unknown };
      const imageId = typeof body.imageId === 'string' ? body.imageId.trim() : '';
      if (!imageId) {
        return NextResponse.json({ error: 'imageId é obrigatório.' }, { status: 400 });
      }
      const venueImageRepo = new DrizzleVenueImageRepository();
      const imageRepo = new DrizzleImageRepository();
      const item = await new AttachImageToVenueUseCase(venueImageRepo, imageRepo).execute(
        venueId,
        imageId,
        user.id,
      );
      return NextResponse.json({ image: toDTO(item) }, { status: 201 });
    } catch (error) {
      if (error instanceof AttachImageToVenueError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: 'Falha ao vincular imagem.' }, { status: 500 });
    }
  }

  static async reorder(req: NextRequest, _user: AuthUser, venueId: string): Promise<NextResponse> {
    try {
      const body = (await req.json()) as { imageIds?: unknown };
      if (!Array.isArray(body.imageIds) || !body.imageIds.every((x) => typeof x === 'string')) {
        return NextResponse.json({ error: 'imageIds deve ser um array de strings.' }, { status: 400 });
      }
      const imageIds = (body.imageIds as string[]).map((id) => id.trim());
      const repo = new DrizzleVenueImageRepository();
      await new ReorderVenueImagesUseCase(repo).execute(venueId, imageIds);
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      if (error instanceof ReorderVenueImagesError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: 'Falha ao reordenar fotos.' }, { status: 500 });
    }
  }

  static async detach(
    _req: NextRequest,
    _user: AuthUser,
    venueId: string,
    imageId: string,
  ): Promise<NextResponse> {
    try {
      const repo = new DrizzleVenueImageRepository();
      const removed = await new DetachVenueImageUseCase(repo).execute(venueId, imageId);
      if (!removed) {
        return NextResponse.json({ error: 'Vínculo não encontrado.' }, { status: 404 });
      }
      return new NextResponse(null, { status: 204 });
    } catch {
      return NextResponse.json({ error: 'Falha ao remover foto.' }, { status: 500 });
    }
  }
}
