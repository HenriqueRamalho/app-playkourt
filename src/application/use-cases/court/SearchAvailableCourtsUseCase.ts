import { CourtRepositoryInterface, AvailabilitySearchFilters, AvailableCourtResult } from '@/domain/court/repository/court-repository.interface';

export class SearchAvailableCourtsUseCase {
  constructor(private courtRepository: CourtRepositoryInterface) {}

  async execute(filters: AvailabilitySearchFilters): Promise<AvailableCourtResult[]> {
    if (!filters.cityId) throw new Error('City is required');
    if (!filters.sportType) throw new Error('Sport type is required');
    if (!filters.date) throw new Error('Date is required');
    if (!filters.startTime) throw new Error('Start time is required');
    if (!filters.endTime) throw new Error('End time is required');
    if (filters.startTime >= filters.endTime) throw new Error('End time must be after start time');

    return this.courtRepository.searchAvailable(filters);
  }
}
