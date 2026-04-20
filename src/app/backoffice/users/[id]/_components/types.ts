export interface OverviewRecentBooking {
  id: string;
  date: string;
  startTime: string;
  durationHours: number;
  status: string;
  courtName: string;
  venueName: string;
}

export interface OverviewLastActiveSession {
  ipAddress: string | null;
  userAgent: string | null;
  updatedAt: string;
}

export interface OverviewDTO {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string | null;

  banned: boolean;
  banReason: string | null;
  banSource: string | null;
  bannedAt: string | null;

  providers: string[];

  venuesOwnedCount: number;
  venuesMemberCount: number;
  bookingsCount: number;
  paymentsCount: number | null;

  recentBookings: OverviewRecentBooking[];
  lastActiveSession: OverviewLastActiveSession | null;
}

export interface OwnedVenueDTO {
  id: string;
  name: string;
  cityName: string;
  stateUf: string;
  isActive: boolean;
  createdAt: string;
}

export interface MemberVenueDTO {
  id: string;
  name: string;
  role: string;
  cityName: string;
  stateUf: string;
  isActive: boolean;
}

export interface VenuesDTO {
  owned: OwnedVenueDTO[];
  member: MemberVenueDTO[];
}

export interface BookingDTO {
  id: string;
  date: string;
  startTime: string;
  durationHours: number;
  status: string;
  courtId: string;
  courtName: string;
  venueId: string;
  venueName: string;
  createdAt: string;
}

export interface BookingsResponse {
  data: BookingDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SessionDTO {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface SessionsResponse {
  data: SessionDTO[];
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function banLabel(banned: boolean, banSource: string | null): string {
  if (!banned) return 'Ativo';
  switch (banSource) {
    case 'user_requested_deletion':
      return 'Exclusão solicitada';
    case 'staff':
      return 'Bloqueado';
    default:
      return 'Banido';
  }
}
