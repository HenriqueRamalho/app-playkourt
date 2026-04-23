import type { VenueImage } from '@/domain/venue-image/entity/venue-image.interface';
import type { VenueImageRepositoryInterface } from '@/domain/venue-image/repository/venue-image-repository.interface';
import type { ImageRepositoryInterface } from '@/domain/image/repository/image-repository.interface';

export const MAX_VENUE_IMAGES = 10;

export class AttachImageToVenueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AttachImageToVenueError';
  }
}

export class AttachImageToVenueUseCase {
  constructor(
    private venueImageRepo: VenueImageRepositoryInterface,
    private imageRepo: ImageRepositoryInterface,
  ) {}

  async execute(venueId: string, imageId: string, userId: string): Promise<VenueImage> {
    const image = await this.imageRepo.findByIdAndOwnerId(imageId, userId);
    if (!image) {
      throw new AttachImageToVenueError('Imagem não encontrada ou não pertence a você.');
    }

    const existing = await this.venueImageRepo.findLink(venueId, imageId);
    if (existing) return existing;

    const count = await this.venueImageRepo.countByVenueId(venueId);
    if (count >= MAX_VENUE_IMAGES) {
      throw new AttachImageToVenueError(
        `O estabelecimento já possui o limite de ${MAX_VENUE_IMAGES} fotos.`,
      );
    }

    return this.venueImageRepo.attach(venueId, imageId, count);
  }
}
