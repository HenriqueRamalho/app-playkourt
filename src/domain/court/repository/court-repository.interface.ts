import { Court } from '../entity/court.interface';

export interface CourtRepositoryInterface {
  create(court: Omit<Court, 'id' | 'createdAt'>): Promise<Court>;
  findByVenueId(venueId: string): Promise<Court[]>;
}
