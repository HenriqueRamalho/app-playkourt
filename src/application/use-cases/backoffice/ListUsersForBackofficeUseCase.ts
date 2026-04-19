import {
  BackofficeUserRepositoryInterface,
  ListBackofficeUsersCriteria,
  ListBackofficeUsersResult,
} from '@/domain/user/repository/backoffice-user-repository.interface';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;
const MAX_FILTER_LENGTH = 255;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ListUsersForBackofficeInput {
  id?: string;
  email?: string;
  name?: string;
  banned?: boolean;
  page?: number;
  pageSize?: number;
}

export class ListUsersForBackofficeUseCase {
  constructor(private readonly repository: BackofficeUserRepositoryInterface) {}

  async execute(input: ListUsersForBackofficeInput): Promise<ListBackofficeUsersResult> {
    const criteria = this.parseInput(input);
    return this.repository.list(criteria);
  }

  private parseInput(input: ListUsersForBackofficeInput): ListBackofficeUsersCriteria {
    const id = this.normalizeString(input.id);
    if (id && !UUID_REGEX.test(id)) {
      throw new Error('Invalid id: expected a UUID');
    }

    const email = this.normalizeString(input.email)?.toLowerCase();
    const name = this.normalizeString(input.name);

    const page = this.normalizePositiveInt(input.page, 1);
    const pageSizeRaw = this.normalizePositiveInt(input.pageSize, DEFAULT_PAGE_SIZE);
    const pageSize = Math.min(pageSizeRaw, MAX_PAGE_SIZE);

    return { id, email, name, banned: input.banned, page, pageSize };
  }

  private normalizeString(value?: string): string | undefined {
    if (value === undefined || value === null) return undefined;
    const trimmed = String(value).trim();
    if (!trimmed) return undefined;
    if (trimmed.length > MAX_FILTER_LENGTH) {
      throw new Error(`Filter too long (max ${MAX_FILTER_LENGTH} chars)`);
    }
    return trimmed;
  }

  private normalizePositiveInt(value: number | undefined, fallback: number): number {
    if (value === undefined || value === null || Number.isNaN(value)) return fallback;
    const asInt = Math.floor(Number(value));
    if (!Number.isFinite(asInt) || asInt < 1) return fallback;
    return asInt;
  }
}
