import { Court, SportType } from './court.interface';

export class CourtEntity implements Court {
  id: string;
  venueId: string;
  name: string;
  sportType: SportType;
  description?: string;
  pricePerHour: number;
  isActive: boolean;
  createdAt: Date;

  constructor(params: Omit<Court, 'id' | 'isActive' | 'createdAt'> & Partial<Pick<Court, 'id' | 'isActive' | 'createdAt'>>) {
    this.id = params.id ?? crypto.randomUUID();
    this.venueId = params.venueId;
    this.name = params.name;
    this.sportType = params.sportType;
    this.description = params.description;
    this.pricePerHour = params.pricePerHour;
    this.isActive = params.isActive ?? true;
    this.createdAt = params.createdAt ?? new Date();

    this.validate();
  }

  private validate(): void {
    if (!this.name?.trim()) throw new Error('Name is required');
    if (!this.venueId) throw new Error('Venue is required');
    if (!this.sportType) throw new Error('Sport type is required');
    if (this.pricePerHour <= 0) throw new Error('Price per hour must be greater than zero');
  }
}
