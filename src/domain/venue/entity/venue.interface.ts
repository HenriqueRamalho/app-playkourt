export interface BusinessHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  openTime: string | null;  // "08:00"
  closeTime: string | null; // "22:00"
  isClosed: boolean;
}

export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};

export const DEFAULT_BUSINESS_HOURS: BusinessHours[] = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
  dayOfWeek: dayOfWeek as BusinessHours['dayOfWeek'],
  openTime: '08:00',
  closeTime: '22:00',
  isClosed: dayOfWeek === 0,
}));

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
  businessHours?: BusinessHours[];
  createdAt: Date;
}
