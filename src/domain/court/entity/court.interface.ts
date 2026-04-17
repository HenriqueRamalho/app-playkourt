export enum SportType {
  VOLLEYBALL = 'volleyball',
  BEACH_VOLLEYBALL = 'beach_volleyball',
  FOOTBALL = 'football',
  FUTSAL = 'futsal',
  BASKETBALL = 'basketball',
  TENNIS = 'tennis',
  PADEL = 'padel',
  SQUASH = 'squash',
  BADMINTON = 'badminton',
  OTHER = 'other',
}

export const SPORT_TYPE_LABELS: Record<SportType, string> = {
  [SportType.VOLLEYBALL]: 'Vôlei',
  [SportType.BEACH_VOLLEYBALL]: 'Vôlei de Praia',
  [SportType.FOOTBALL]: 'Futebol',
  [SportType.FUTSAL]: 'Futsal',
  [SportType.BASKETBALL]: 'Basquete',
  [SportType.TENNIS]: 'Tênis',
  [SportType.PADEL]: 'Padel',
  [SportType.SQUASH]: 'Squash',
  [SportType.BADMINTON]: 'Badminton',
  [SportType.OTHER]: 'Outro',
};

// Bloqueio pontual para uma data específica (ex: manutenção)
export interface CourtDateException {
  date: string;         // YYYY-MM-DD
  isFullDayBlock: boolean;
  startTime?: string;   // HH:MM
  endTime?: string;     // HH:MM
  reason?: string;
}

// Bloqueio recorrente por dia da semana (ex: contrato com escola)
export interface CourtRecurringBlock {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface Court {
  id: string;
  venueId: string;
  name: string;
  sportType: SportType;
  description?: string;
  pricePerHour: number;
  isActive: boolean;
  useVenueHours: boolean;
  createdAt: Date;
}

// Dados de scheduling carregados junto com a court pelo repositório
export interface CourtWithSchedule extends Court {
  businessHours: import('@/domain/venue/entity/venue.interface').BusinessHours[];
  dateExceptions: CourtDateException[];
  recurringBlocks: CourtRecurringBlock[];
}
