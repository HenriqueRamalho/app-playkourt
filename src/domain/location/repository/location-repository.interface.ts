import { City, State } from '../entity/location.interface';

export interface LocationRepositoryInterface {
  findAllStates(): Promise<State[]>;
  findCitiesByStateId(stateId: number): Promise<City[]>;
}
