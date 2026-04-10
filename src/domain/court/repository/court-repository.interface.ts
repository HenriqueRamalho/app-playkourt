import { Court } from '../entity/court.interface';

export interface CourtRepositoryInterface {
  create(court: Omit<Court, 'id' | 'createdAt'>): Promise<Court>;
  findById(id: string): Promise<Court | null>;
  findByVenueId(venueId: string): Promise<Court[]>;
  update(id: string, court: Partial<Omit<Court, 'id' | 'venueId' | 'createdAt'>>): Promise<Court>;
}
