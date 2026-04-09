import { Venue } from './venue.interface';

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
  city: string;
  state: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
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
    this.city = params.city;
    this.state = params.state;
    this.zipCode = params.zipCode;
    this.latitude = params.latitude;
    this.longitude = params.longitude;
    this.isActive = params.isActive ?? true;
    this.createdAt = params.createdAt ?? new Date();

    this.validate();
  }

  private validate(): void {
    if (!this.name?.trim()) throw new Error('Name is required');
    if (!this.city?.trim()) throw new Error('City is required');
    if (!this.state?.trim() || this.state.length !== 2) throw new Error('State must be a 2-character code');
    if (!this.ownerId) throw new Error('Owner is required');
  }
}
