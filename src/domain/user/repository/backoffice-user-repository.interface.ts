import { BanSource } from '../entity/ban-source';

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

export interface BackofficeUserRepositoryInterface {
  list(criteria: ListBackofficeUsersCriteria): Promise<ListBackofficeUsersResult>;
}
