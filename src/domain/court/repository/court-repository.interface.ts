import { Court, SportType } from '../entity/court.interface';

export interface CourtSearchFilters {
  cityId: number;
  neighborhood?: string;
  sportType?: SportType;
}

export interface CourtRepositoryInterface {
  create(court: Omit<Court, 'id' | 'createdAt'>): Promise<Court>;
  findById(id: string): Promise<Court | null>;
  findByVenueId(venueId: string): Promise<Court[]>;
  update(id: string, court: Partial<Omit<Court, 'id' | 'venueId' | 'createdAt'>>): Promise<Court>;
  delete(id: string): Promise<void>;
  search(filters: CourtSearchFilters): Promise<(Court & { venueName: string; neighborhood: string; cityName: string })[]>;
}
