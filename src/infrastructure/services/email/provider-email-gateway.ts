import { EmailProvider } from '@/domain/email/entity/email-provider';

export interface ProviderSendInput {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  tags?: string[];
  headers?: Record<string, string>;
}

export type ProviderSendOutput =
  | { status: 'sent'; providerMessageId: string }
  | { status: 'suppressed' }
  | { status: 'failed'; error: string };

export interface ProviderEmailGateway {
  readonly provider: EmailProvider;
  send(input: ProviderSendInput): Promise<ProviderSendOutput>;
}
