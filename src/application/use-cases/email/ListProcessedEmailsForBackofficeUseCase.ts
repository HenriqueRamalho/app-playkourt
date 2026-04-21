import { EmailProvider, parseEmailProvider } from '@/domain/email/entity/email-provider';
import { ProviderStatus, parseProviderStatus } from '@/domain/email/entity/provider-status';
import {
  ListProcessedEmailsCriteria,
  ListProcessedEmailsResult,
  ProcessedEmailRepositoryInterface,
} from '@/domain/email/repository/processed-email-repository.interface';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;
const MAX_STRING_FILTER_LENGTH = 255;
const MAX_METADATA_KEY_LENGTH = 100;
const MAX_METADATA_VALUE_LENGTH = 500;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ListProcessedEmailsForBackofficeInput {
  sentFrom?: string;
  sentTo?: string;
  to?: string;
  subject?: string;
  from?: string;
  recipientUserId?: string;
  metadataKey?: string;
  metadataValue?: string;
  provider?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export class ListProcessedEmailsForBackofficeUseCase {
  constructor(private readonly repository: ProcessedEmailRepositoryInterface) {}

  async execute(
    input: ListProcessedEmailsForBackofficeInput,
  ): Promise<ListProcessedEmailsResult> {
    return this.repository.list(this.parseInput(input));
  }

  private parseInput(input: ListProcessedEmailsForBackofficeInput): ListProcessedEmailsCriteria {
    const sentFrom = this.parseDate(input.sentFrom, 'sentFrom');
    const sentTo = this.parseDate(input.sentTo, 'sentTo');
    if (sentFrom && sentTo && sentFrom.getTime() > sentTo.getTime()) {
      throw new Error('Invalid date range: sentFrom must be <= sentTo');
    }

    const to = this.normalizeString(input.to, MAX_STRING_FILTER_LENGTH, 'to');
    const subject = this.normalizeString(input.subject, MAX_STRING_FILTER_LENGTH, 'subject');
    const from = this.normalizeString(input.from, MAX_STRING_FILTER_LENGTH, 'from');

    const recipientUserId = this.normalizeString(
      input.recipientUserId,
      MAX_STRING_FILTER_LENGTH,
      'recipientUserId',
    );
    if (recipientUserId && !UUID_REGEX.test(recipientUserId)) {
      throw new Error('Invalid recipientUserId: expected a UUID');
    }

    const metadataKey = this.normalizeString(
      input.metadataKey,
      MAX_METADATA_KEY_LENGTH,
      'metadataKey',
    );
    const metadataValue = this.normalizeString(
      input.metadataValue,
      MAX_METADATA_VALUE_LENGTH,
      'metadataValue',
    );
    if ((metadataKey && !metadataValue) || (!metadataKey && metadataValue)) {
      throw new Error('Invalid metadata filter: provide both metadataKey and metadataValue');
    }

    let provider: EmailProvider | undefined;
    if (input.provider) {
      const parsed = parseEmailProvider(input.provider);
      if (!parsed) throw new Error(`Invalid provider: ${input.provider}`);
      provider = parsed;
    }

    let status: ProviderStatus | undefined;
    if (input.status) {
      const parsed = parseProviderStatus(input.status);
      if (!parsed) throw new Error(`Invalid status: ${input.status}`);
      status = parsed;
    }

    const page = this.normalizePositiveInt(input.page, 1);
    const pageSizeRaw = this.normalizePositiveInt(input.pageSize, DEFAULT_PAGE_SIZE);
    const pageSize = Math.min(pageSizeRaw, MAX_PAGE_SIZE);

    return {
      sentFrom,
      sentTo,
      to,
      subject,
      from,
      recipientUserId,
      metadataKey,
      metadataValue,
      provider,
      status,
      page,
      pageSize,
    };
  }

  private normalizeString(
    value: string | undefined,
    maxLength: number,
    fieldName: string,
  ): string | undefined {
    if (value === undefined || value === null) return undefined;
    const trimmed = String(value).trim();
    if (!trimmed) return undefined;
    if (trimmed.length > maxLength) {
      throw new Error(`Invalid ${fieldName}: max length ${maxLength}`);
    }
    return trimmed;
  }

  private parseDate(value: string | undefined, fieldName: string): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid ${fieldName}: not an ISO-8601 date`);
    }
    return date;
  }

  private normalizePositiveInt(value: number | undefined, fallback: number): number {
    if (value === undefined || value === null || Number.isNaN(value)) return fallback;
    const asInt = Math.floor(Number(value));
    if (!Number.isFinite(asInt) || asInt < 1) return fallback;
    return asInt;
  }
}
