import { Court, SportType } from '../entity/court.interface';

export interface CourtSearchFilters {
  cityId: number;
  neighborhood?: string;
  sportType?: SportType;
}

export interface VenueSearchResult {
  venueId: string;
  venueName: string;
  street: string;
  number: string;
  neighborhood: string;
  cityName: string;
  sports: { sportType: SportType; count: number }[];
}

export interface CourtRepositoryInterface {
  create(court: Omit<Court, 'id' | 'createdAt'>): Promise<Court>;
  findById(id: string): Promise<Court | null>;
  findByVenueId(venueId: string): Promise<Court[]>;
  update(id: string, court: Partial<Omit<Court, 'id' | 'venueId' | 'createdAt'>>): Promise<Court>;
  delete(id: string): Promise<void>;
  searchVenues(filters: CourtSearchFilters): Promise<VenueSearchResult[]>;
}
