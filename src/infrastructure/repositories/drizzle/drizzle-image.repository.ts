import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '@/infrastructure/database/drizzle/client';
import { images } from '@/infrastructure/database/drizzle/schema/images';
import type { CreateImageInput, Image } from '@/domain/image/entity/image.interface';
import type { ImageRepositoryInterface } from '@/domain/image/repository/image-repository.interface';

type ImageRow = typeof images.$inferSelect;

export class DrizzleImageRepository implements ImageRepositoryInterface {
  private toDomain(row: ImageRow): Image {
    return {
      id: row.id,
      ownerId: row.ownerId,
      storageKey: row.storageKey,
      publicUrl: row.publicUrl,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      originalName: row.originalName ?? undefined,
      createdAt: row.createdAt ?? new Date(),
    };
  }

  async create(input: CreateImageInput): Promise<Image> {
    const db = getDb();
    try {
      const [row] = await db
        .insert(images)
        .values({
          ownerId: input.ownerId,
          storageKey: input.storageKey,
          publicUrl: input.publicUrl,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          originalName: input.originalName,
        })
        .returning();
      if (!row) throw new Error('Falha ao registrar imagem.');
      return this.toDomain(row);
    } catch (e) {
      const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: string }).code) : '';
      if (code === '23505') {
        throw new Error('Esta imagem já está registrada na galeria.');
      }
      throw e;
    }
  }

  async listByOwnerId(ownerId: string): Promise<Image[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(images)
      .where(eq(images.ownerId, ownerId))
      .orderBy(desc(images.createdAt));
    return rows.map((r) => this.toDomain(r));
  }

  async deleteByIdAndOwnerId(id: string, ownerId: string): Promise<boolean> {
    const db = getDb();
    const result = await db
      .delete(images)
      .where(and(eq(images.id, id), eq(images.ownerId, ownerId)))
      .returning({ id: images.id });
    return result.length > 0;
  }
}
