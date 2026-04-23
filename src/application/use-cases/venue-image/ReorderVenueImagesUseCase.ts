import type { VenueImageRepositoryInterface } from '@/domain/venue-image/repository/venue-image-repository.interface';

export class ReorderVenueImagesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReorderVenueImagesError';
  }
}

function sortedKey(ids: string[]): string {
  return [...ids].sort().join('\0');
}

export class ReorderVenueImagesUseCase {
  constructor(private venueImageRepo: VenueImageRepositoryInterface) {}

  async execute(venueId: string, imageIds: string[]): Promise<void> {
    if (imageIds.length === 0) {
      throw new ReorderVenueImagesError('Envie a ordem das imagens (pelo menos uma).');
    }
    if (new Set(imageIds).size !== imageIds.length) {
      throw new ReorderVenueImagesError('Lista de imagens contém duplicatas.');
    }

    const current = await this.venueImageRepo.listByVenueId(venueId);
    const currentImageIds = current.map((c) => c.imageId);
    if (imageIds.length !== currentImageIds.length) {
      throw new ReorderVenueImagesError(
        'A lista de imagens não confere com as fotos atuais do local.',
      );
    }
    if (sortedKey(imageIds) !== sortedKey(currentImageIds)) {
      throw new ReorderVenueImagesError(
        'A lista de imagens não confere com as fotos atuais do local.',
      );
    }

    await this.venueImageRepo.reorder(venueId, imageIds);
  }
}
