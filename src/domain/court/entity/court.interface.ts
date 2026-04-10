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

export interface Court {
  id: string;
  venueId: string;
  name: string;
  sportType: SportType;
  description?: string;
  pricePerHour: number;
  isActive: boolean;
  createdAt: Date;
}
