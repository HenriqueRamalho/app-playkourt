import type { VenueImage } from '@/domain/venue-image/entity/venue-image.interface';
import type { VenueImageRepositoryInterface } from '@/domain/venue-image/repository/venue-image-repository.interface';

export class ListVenueImagesUseCase {
  constructor(private repo: VenueImageRepositoryInterface) {}

  async execute(venueId: string): Promise<VenueImage[]> {
    return this.repo.listByVenueId(venueId);
  }
}
