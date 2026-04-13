import { CourtRepositoryInterface, CourtSearchFilters, VenueSearchResult } from '@/domain/court/repository/court-repository.interface';

export class SearchCourtsUseCase {
  constructor(private courtRepository: CourtRepositoryInterface) {}

  async execute(filters: CourtSearchFilters): Promise<VenueSearchResult[]> {
    if (!filters.cityId) throw new Error('City is required');
    return this.courtRepository.searchVenues(filters);
  }
}
