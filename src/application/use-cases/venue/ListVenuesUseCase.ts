import { VenueRepositoryInterface } from '@/domain/venue/repository/venue-repository.interface';
import { Venue } from '@/domain/venue/entity/venue.interface';

export class ListVenuesUseCase {
  constructor(private venueRepository: VenueRepositoryInterface) {}

  async execute(userId: string): Promise<Venue[]> {
    return this.venueRepository.findByMemberId(userId);
  }
}
