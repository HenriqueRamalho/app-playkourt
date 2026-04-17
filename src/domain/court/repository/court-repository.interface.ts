import { Court, SportType, CourtDateException, CourtRecurringBlock, CourtWithSchedule } from '../entity/court.interface';
import { BusinessHours } from '@/domain/venue/entity/venue.interface';

export interface CourtSearchFilters {
  cityId: number;
  neighborhood?: string;
  sportType?: SportType;
}

export interface AvailabilitySearchFilters {
  cityId: number;
  sportType: SportType;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
}

export interface AvailableCourtResult {
  courtId: string;
  courtName: string;
  sportType: SportType;
  pricePerHour: number;
  description?: string;
  venueId: string;
  venueName: string;
  neighborhood: string;
  cityName: string;
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
  findByIdWithSchedule(id: string, venueBusinessHours: BusinessHours[]): Promise<CourtWithSchedule | null>;
  findByVenueId(venueId: string): Promise<Court[]>;
  update(id: string, court: Partial<Omit<Court, 'id' | 'venueId' | 'createdAt'>>): Promise<Court>;
  updateSchedule(courtId: string, businessHours: BusinessHours[], dateExceptions: CourtDateException[], recurringBlocks: CourtRecurringBlock[]): Promise<void>;
  delete(id: string): Promise<void>;
  searchVenues(filters: CourtSearchFilters): Promise<VenueSearchResult[]>;
  searchAvailable(filters: AvailabilitySearchFilters): Promise<AvailableCourtResult[]>;
}
