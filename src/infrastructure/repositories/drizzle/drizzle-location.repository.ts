import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/infrastructure/database/drizzle/client';
import { states, cities } from '@/infrastructure/database/drizzle/schema';
import { City, State } from '@/domain/location/entity/location.interface';
import { LocationRepositoryInterface } from '@/domain/location/repository/location-repository.interface';

export class DrizzleLocationRepository implements LocationRepositoryInterface {
  async findAllStates(): Promise<State[]> {
    const db = getDb();
    const rows = await db
      .select({ id: states.id, uf: states.uf, name: states.name })
      .from(states)
      .orderBy(asc(states.name));
    return rows;
  }

  async findCitiesByStateId(stateId: number): Promise<City[]> {
    const db = getDb();
    const rows = await db
      .select({ id: cities.id, name: cities.name, stateId: cities.stateId })
      .from(cities)
      .where(eq(cities.stateId, stateId))
      .orderBy(asc(cities.name));
    return rows;
  }
}
