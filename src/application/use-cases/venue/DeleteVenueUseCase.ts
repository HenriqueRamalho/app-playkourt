import { VenueRepositoryInterface } from '@/domain/venue/repository/venue-repository.interface';

export class DeleteVenueUseCase {
  constructor(private venueRepository: VenueRepositoryInterface) {}

  async execute(id: string): Promise<void> {
    return this.venueRepository.delete(id);
  }
}
