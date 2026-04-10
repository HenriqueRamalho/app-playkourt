import { LocationRepositoryInterface } from '@/domain/location/repository/location-repository.interface';
import { State } from '@/domain/location/entity/location.interface';

export class ListStatesUseCase {
  constructor(private locationRepository: LocationRepositoryInterface) {}

  async execute(): Promise<State[]> {
    return this.locationRepository.findAllStates();
  }
}
