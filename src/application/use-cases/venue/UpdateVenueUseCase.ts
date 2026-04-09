import { VenueRepositoryInterface } from '@/domain/venue/repository/venue-repository.interface';
import { Venue } from '@/domain/venue/entity/venue.interface';

export type UpdateVenueInput = Partial<Omit<Venue, 'id' | 'ownerId' | 'createdAt'>>;

export class UpdateVenueUseCase {
  constructor(private venueRepository: VenueRepositoryInterface) {}

  async execute(id: string, input: UpdateVenueInput): Promise<Venue> {
    return this.venueRepository.update(id, input);
  }
}
