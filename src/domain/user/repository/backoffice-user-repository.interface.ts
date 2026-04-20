import { BanSource } from '../entity/ban-source';
import { BookingStatus } from '@/domain/booking/entity/booking.interface';

export interface BackofficeUserListItem {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  banned: boolean;
  banReason: string | null;
  banSource: BanSource | null;
  bannedAt: Date | null;
  createdAt: Date;
  lastSeenAt: Date | null;
}

export interface ListBackofficeUsersCriteria {
  id?: string;
  email?: string;
  name?: string;
  banned?: boolean;
  page: number;
  pageSize: number;
}

export interface ListBackofficeUsersResult {
  items: BackofficeUserListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BackofficeUserOverviewBooking {
  id: string;
  date: string;
  startTime: string;
  durationHours: number;
  status: BookingStatus;
  courtName: string;
  venueName: string;
}

export interface BackofficeUserOverviewSession {
  ipAddress: string | null;
  userAgent: string | null;
  updatedAt: Date;
}

export interface BackofficeUserOverview {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt: Date | null;

  banned: boolean;
  banReason: string | null;
  banSource: BanSource | null;
  bannedAt: Date | null;

  providers: string[];

  venuesOwnedCount: number;
  venuesMemberCount: number;
  bookingsCount: number;
  paymentsCount: number | null;

  recentBookings: BackofficeUserOverviewBooking[];
  lastActiveSession: BackofficeUserOverviewSession | null;
}

export interface BackofficeUserOwnedVenue {
  id: string;
  name: string;
  cityName: string;
  stateUf: string;
  isActive: boolean;
  createdAt: Date;
}

export interface BackofficeUserMemberVenue {
  id: string;
  name: string;
  role: string;
  cityName: string;
  stateUf: string;
  isActive: boolean;
}

export interface BackofficeUserVenues {
  owned: BackofficeUserOwnedVenue[];
  member: BackofficeUserMemberVenue[];
}

export interface BackofficeUserBookingItem {
  id: string;
  date: string;
  startTime: string;
  durationHours: number;
  status: BookingStatus;
  courtId: string;
  courtName: string;
  venueId: string;
  venueName: string;
  createdAt: Date;
}

export interface ListBackofficeUserBookingsCriteria {
  userId: string;
  status?: BookingStatus;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

export interface ListBackofficeUserBookingsResult {
  items: BackofficeUserBookingItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BackofficeUserActiveSession {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface BackofficeUserBanTarget {
  id: string;
  email: string;
  banned: boolean;
  banReason: string | null;
  banSource: BanSource | null;
  bannedAt: Date | null;
}

export interface BackofficeUserBanState {
  id: string;
  banned: boolean;
  banReason: string | null;
  banSource: BanSource | null;
  bannedAt: Date | null;
}

export interface BanUserInput {
  reason: string;
  source: BanSource;
}

export interface BackofficeUserRepositoryInterface {
  list(criteria: ListBackofficeUsersCriteria): Promise<ListBackofficeUsersResult>;
  findOverviewById(userId: string): Promise<BackofficeUserOverview | null>;
  listVenues(userId: string): Promise<BackofficeUserVenues>;
  listBookings(criteria: ListBackofficeUserBookingsCriteria): Promise<ListBackofficeUserBookingsResult>;
  listActiveSessions(userId: string): Promise<BackofficeUserActiveSession[]>;
  findBanTargetById(userId: string): Promise<BackofficeUserBanTarget | null>;
  banUser(userId: string, input: BanUserInput): Promise<BackofficeUserBanState>;
  unbanUser(userId: string): Promise<BackofficeUserBanState>;
  deleteSessionsOfUser(userId: string): Promise<number>;
}
