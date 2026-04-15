import { Venue, BusinessHours, DEFAULT_BUSINESS_HOURS } from './venue.interface';

export class VenueEntity implements Venue {
  id: string;
  ownerId: string;
  name: string;
  cnpj?: string;
  phone?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  cityId: number;
  cityName: string;
  stateId: number;
  stateName: string;
  stateUf: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  businessHours: BusinessHours[];
  createdAt: Date;

  constructor(params: Omit<Venue, 'id' | 'isActive' | 'createdAt'> & Partial<Pick<Venue, 'id' | 'isActive' | 'createdAt'>>) {
    this.id = params.id ?? crypto.randomUUID();
    this.ownerId = params.ownerId;
    this.name = params.name;
    this.cnpj = params.cnpj;
    this.phone = params.phone;
    this.street = params.street;
    this.number = params.number;
    this.complement = params.complement;
    this.neighborhood = params.neighborhood;
    this.cityId = params.cityId;
    this.cityName = params.cityName;
    this.stateId = params.stateId;
    this.stateName = params.stateName;
    this.stateUf = params.stateUf;
    this.zipCode = params.zipCode;
    this.latitude = params.latitude;
    this.longitude = params.longitude;
    this.isActive = params.isActive ?? true;
    this.businessHours = params.businessHours ?? DEFAULT_BUSINESS_HOURS;
    this.createdAt = params.createdAt ?? new Date();

    this.validate();
  }

  private validate(): void {
    if (!this.name?.trim()) throw new Error('Name is required');
    if (!this.cityId) throw new Error('City is required');
    if (!this.stateId) throw new Error('State is required');
    if (!this.ownerId) throw new Error('Owner is required');
  }
}
