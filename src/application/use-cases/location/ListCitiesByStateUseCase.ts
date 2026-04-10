import { LocationRepositoryInterface } from '@/domain/location/repository/location-repository.interface';
import { City } from '@/domain/location/entity/location.interface';

export class ListCitiesByStateUseCase {
  constructor(private locationRepository: LocationRepositoryInterface) {}

  async execute(stateId: number): Promise<City[]> {
    return this.locationRepository.findCitiesByStateId(stateId);
  }
}
