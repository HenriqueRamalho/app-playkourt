import { CourtRepositoryInterface } from '@/domain/court/repository/court-repository.interface';
import { Court } from '@/domain/court/entity/court.interface';

export class ListCourtsUseCase {
  constructor(private courtRepository: CourtRepositoryInterface) {}

  async execute(venueId: string): Promise<Court[]> {
    return this.courtRepository.findByVenueId(venueId);
  }
}
