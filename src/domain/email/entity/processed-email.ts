import { EmailProvider } from './email-provider';
import { EmailStatus } from './email-status';
import { ProviderStatus } from './provider-status';

export type EmailMetadataValue = string | number | boolean;
export type EmailMetadata = Record<string, EmailMetadataValue>;

export interface ProcessedEmail {
  id: string;
  provider: EmailProvider;
  providerMessageId: string | null;

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
  lastProviderStatus: ProviderStatus | null;
  lastProviderStatusAt: Date | null;
  lastProviderError: string | null;

  resentFromId: string | null;
  resentByUserId: string | null;

  createdAt: Date;
  deliveredAt: Date | null;
}
