import { EmailMetadata } from '../entity/processed-email';

export interface SendEmailInput {
  to: string | string[];
  recipientUserId?: string | (string | null)[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  tags?: string[];
  metadata?: EmailMetadata;
  templateName?: string;
  idempotencyKey?: string;
}

export interface SendEmailResultItem {
  processedEmailId: string;
  providerMessageId: string | null;
  status: 'sent' | 'failed' | 'suppressed';
  error?: string;
}

export interface SendEmailResult {
  items: SendEmailResultItem[];
  groupId?: string;
}

export interface EmailSender {
  sendEmail(input: SendEmailInput): Promise<SendEmailResult>;
}

export class InvalidSenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSenderError';
  }
}

export class InvalidEmailInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailInputError';
  }
}
