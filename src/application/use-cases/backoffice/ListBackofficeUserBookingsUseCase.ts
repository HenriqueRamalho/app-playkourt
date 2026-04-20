import { BookingStatus } from '@/domain/booking/entity/booking.interface';
import {
  BackofficeUserRepositoryInterface,
  ListBackofficeUserBookingsCriteria,
  ListBackofficeUserBookingsResult,
} from '@/domain/user/repository/backoffice-user-repository.interface';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

const VALID_STATUSES = new Set<string>([
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.CANCELLED,
]);

export interface ListBackofficeUserBookingsInput {
  userId: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export class ListBackofficeUserBookingsUseCase {
  constructor(private readonly repository: BackofficeUserRepositoryInterface) {}

  async execute(input: ListBackofficeUserBookingsInput): Promise<ListBackofficeUserBookingsResult> {
    const criteria = this.parseInput(input);
    return this.repository.listBookings(criteria);
  }

  private parseInput(input: ListBackofficeUserBookingsInput): ListBackofficeUserBookingsCriteria {
    if (!input.userId || !UUID_REGEX.test(input.userId)) {
      throw new Error('Invalid id: expected a UUID');
    }

    let status: BookingStatus | undefined;
    if (input.status) {
      if (!VALID_STATUSES.has(input.status)) {
        throw new Error(`Invalid status: ${input.status}`);
      }
      status = input.status as BookingStatus;
    }

    if (input.from && !DATE_REGEX.test(input.from)) {
      throw new Error('Invalid from: expected YYYY-MM-DD');
    }
    if (input.to && !DATE_REGEX.test(input.to)) {
      throw new Error('Invalid to: expected YYYY-MM-DD');
    }
    if (input.from && input.to && input.from > input.to) {
      throw new Error('Invalid range: from must be <= to');
    }

    const page = this.normalizePositiveInt(input.page, 1);
    const pageSizeRaw = this.normalizePositiveInt(input.pageSize, DEFAULT_PAGE_SIZE);
    const pageSize = Math.min(pageSizeRaw, MAX_PAGE_SIZE);

    return {
      userId: input.userId,
      status,
      from: input.from,
      to: input.to,
      page,
      pageSize,
    };
  }

  private normalizePositiveInt(value: number | undefined, fallback: number): number {
    if (value === undefined || value === null || Number.isNaN(value)) return fallback;
    const asInt = Math.floor(Number(value));
    if (!Number.isFinite(asInt) || asInt < 1) return fallback;
    return asInt;
  }
}
