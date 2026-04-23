import type { VenueImageRepositoryInterface } from '@/domain/venue-image/repository/venue-image-repository.interface';

export class DetachVenueImageUseCase {
  constructor(private repo: VenueImageRepositoryInterface) {}

  async execute(venueId: string, imageId: string): Promise<boolean> {
    return this.repo.detachByVenueAndImage(venueId, imageId);
  }
}
