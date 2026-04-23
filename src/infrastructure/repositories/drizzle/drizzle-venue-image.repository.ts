import { and, asc, count, eq } from 'drizzle-orm';
import { getDb } from '@/infrastructure/database/drizzle/client';
import { venueImages } from '@/infrastructure/database/drizzle/schema/venueImages';
import { images } from '@/infrastructure/database/drizzle/schema/images';
import type { VenueImage } from '@/domain/venue-image/entity/venue-image.interface';
import type { VenueImageRepositoryInterface } from '@/domain/venue-image/repository/venue-image-repository.interface';

type Row = typeof venueImages.$inferSelect & {
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string | null;
};

function toDomain(row: Row): VenueImage {
  return {
    id: row.id,
    venueId: row.venueId,
    imageId: row.imageId,
    sortOrder: row.sortOrder,
    publicUrl: row.publicUrl,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    originalName: row.originalName ?? undefined,
    createdAt: row.createdAt != null ? new Date(row.createdAt) : new Date(),
  };
}

export class DrizzleVenueImageRepository implements VenueImageRepositoryInterface {
  async listByVenueId(venueId: string): Promise<VenueImage[]> {
    const db = getDb();
    const rows = await db
      .select({
        id: venueImages.id,
        venueId: venueImages.venueId,
        imageId: venueImages.imageId,
        sortOrder: venueImages.sortOrder,
        createdAt: venueImages.createdAt,
        publicUrl: images.publicUrl,
        mimeType: images.mimeType,
        sizeBytes: images.sizeBytes,
        originalName: images.originalName,
      })
      .from(venueImages)
      .innerJoin(images, eq(images.id, venueImages.imageId))
      .where(eq(venueImages.venueId, venueId))
      .orderBy(asc(venueImages.sortOrder));
    return rows.map(toDomain);
  }

  async countByVenueId(venueId: string): Promise<number> {
    const db = getDb();
    const [row] = await db
      .select({ value: count() })
      .from(venueImages)
      .where(eq(venueImages.venueId, venueId));
    return row?.value ?? 0;
  }

  async attach(venueId: string, imageId: string, sortOrder: number): Promise<VenueImage> {
    const db = getDb();
    const [inserted] = await db
      .insert(venueImages)
      .values({ venueId, imageId, sortOrder })
      .onConflictDoNothing()
      .returning();

    if (!inserted) {
      const existing = await this.findLink(venueId, imageId);
      if (!existing) {
        throw new Error('Falha ao vincular imagem.');
      }
      return existing;
    }

    const rows = await db
      .select({
        id: venueImages.id,
        venueId: venueImages.venueId,
        imageId: venueImages.imageId,
        sortOrder: venueImages.sortOrder,
        createdAt: venueImages.createdAt,
        publicUrl: images.publicUrl,
        mimeType: images.mimeType,
        sizeBytes: images.sizeBytes,
        originalName: images.originalName,
      })
      .from(venueImages)
      .innerJoin(images, eq(images.id, venueImages.imageId))
      .where(eq(venueImages.id, inserted.id))
      .limit(1);

    if (!rows[0]) {
      throw new Error('Falha ao carregar vínculo criado.');
    }
    return toDomain(rows[0]);
  }

  async findLink(venueId: string, imageId: string): Promise<VenueImage | null> {
    const db = getDb();
    const rows = await db
      .select({
        id: venueImages.id,
        venueId: venueImages.venueId,
        imageId: venueImages.imageId,
        sortOrder: venueImages.sortOrder,
        createdAt: venueImages.createdAt,
        publicUrl: images.publicUrl,
        mimeType: images.mimeType,
        sizeBytes: images.sizeBytes,
        originalName: images.originalName,
      })
      .from(venueImages)
      .innerJoin(images, eq(images.id, venueImages.imageId))
      .where(and(eq(venueImages.venueId, venueId), eq(venueImages.imageId, imageId)))
      .limit(1);
    return rows[0] ? toDomain(rows[0]) : null;
  }

  async detachByVenueAndImage(venueId: string, imageId: string): Promise<boolean> {
    const db = getDb();
    const result = await db
      .delete(venueImages)
      .where(and(eq(venueImages.venueId, venueId), eq(venueImages.imageId, imageId)))
      .returning({ id: venueImages.id });
    return result.length > 0;
  }

  async reorder(venueId: string, orderedImageIds: string[]): Promise<void> {
    const db = getDb();
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedImageIds.length; i += 1) {
        const imageId = orderedImageIds[i]!;
        await tx
          .update(venueImages)
          .set({ sortOrder: i })
          .where(and(eq(venueImages.venueId, venueId), eq(venueImages.imageId, imageId)));
      }
    });
  }
}
