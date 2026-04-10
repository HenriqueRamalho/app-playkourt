export interface Venue {
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
  createdAt: Date;
}
