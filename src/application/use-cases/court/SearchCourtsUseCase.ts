import { Court } from '@/domain/court/entity/court.interface';
import { CourtRepositoryInterface, CourtSearchFilters } from '@/domain/court/repository/court-repository.interface';

export type CourtSearchResult = Court & { venueName: string; neighborhood: string; cityName: string };

export class SearchCourtsUseCase {
  constructor(private courtRepository: CourtRepositoryInterface) {}

  async execute(filters: CourtSearchFilters): Promise<CourtSearchResult[]> {
    if (!filters.cityId) throw new Error('City is required');
    return this.courtRepository.search(filters);
  }
}
