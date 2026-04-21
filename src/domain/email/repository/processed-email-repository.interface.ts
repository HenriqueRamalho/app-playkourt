import { EmailProvider } from '../entity/email-provider';
import { EmailStatus } from '../entity/email-status';
import { ProviderStatus } from '../entity/provider-status';
import { EmailMetadata, ProcessedEmail } from '../entity/processed-email';

export interface CreateProcessedEmailInput {
  provider: EmailProvider;
  fromAddress: string;
  toAddress: string;
  recipientUserId: string | null;
  ccAddresses: string[] | null;
  bccAddresses: string[] | null;
  replyToAddress: string | null;
  subject: string;
  htmlBody: string;
  textBody: string | null;
  tags: string[] | null;
  metadata: EmailMetadata;
  templateName: string | null;
  idempotencyKey: string | null;
  status: EmailStatus;
  resentFromId: string | null;
  resentByUserId: string | null;
}

export interface UpdateProcessedEmailAfterSendInput {
  id: string;
  providerMessageId: string | null;
  status: EmailStatus;
  lastProviderError: string | null;
}

export interface ProcessedEmailListItem {
  id: string;
  provider: EmailProvider;
  providerMessageId: string | null;
  toAddress: string;
  recipientUserId: string | null;
  fromAddress: string;
  subject: string;
  templateName: string | null;
  status: EmailStatus;
  lastProviderStatus: ProviderStatus | null;
  lastProviderStatusAt: Date | null;
  createdAt: Date;
  resentFromId: string | null;
}

export interface ProcessedEmailEvent {
  id: string;
  providerEventId: string | null;
  provider: EmailProvider;
  rawStatus: string;
  normalizedStatus: ProviderStatus;
  occurredAt: Date;
  receivedAt: Date;
}

export interface ProcessedEmailDetail extends ProcessedEmail {
  events: ProcessedEmailEvent[];
}

export interface ListProcessedEmailsCriteria {
  sentFrom?: Date;
  sentTo?: Date;
  to?: string;
  subject?: string;
  from?: string;
  recipientUserId?: string;
  metadataKey?: string;
  metadataValue?: string;
  provider?: EmailProvider;
  status?: ProviderStatus;
  page: number;
  pageSize: number;
}

export interface ListProcessedEmailsResult {
  items: ProcessedEmailListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RecordProviderEventInput {
  processedEmailId: string;
  providerEventId: string | null;
  provider: EmailProvider;
  rawStatus: string;
  normalizedStatus: ProviderStatus;
  payload: unknown;
  occurredAt: Date;
}

export interface ProcessedEmailRepositoryInterface {
  create(input: CreateProcessedEmailInput): Promise<ProcessedEmail>;
  updateAfterSend(input: UpdateProcessedEmailAfterSendInput): Promise<void>;
  list(criteria: ListProcessedEmailsCriteria): Promise<ListProcessedEmailsResult>;
  findById(id: string): Promise<ProcessedEmailDetail | null>;
  findByProviderMessageId(
    provider: EmailProvider,
    providerMessageId: string,
  ): Promise<ProcessedEmail | null>;
  recordProviderEvent(input: RecordProviderEventInput): Promise<boolean>;
}
