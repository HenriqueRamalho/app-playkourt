import { EmailProvider } from '@/domain/email/entity/email-provider';
import { ProviderStatus } from '@/domain/email/entity/provider-status';

const RESEND_TO_NORMALIZED: Record<string, ProviderStatus> = {
  'email.sent': ProviderStatus.SENT,
  'email.delivered': ProviderStatus.DELIVERED,
  'email.opened': ProviderStatus.OPENED,
  'email.clicked': ProviderStatus.CLICKED,
  'email.bounced': ProviderStatus.BOUNCED,
  'email.complained': ProviderStatus.COMPLAINED,
  'email.delivery_delayed': ProviderStatus.DELAYED,
  'email.failed': ProviderStatus.FAILED,
};

export interface NormalizedEmailEvent {
  provider: EmailProvider;
  providerMessageId: string;
  providerEventId: string | null;
  rawStatus: string;
  normalizedStatus: ProviderStatus;
  occurredAt: Date;
  payload: unknown;
}

export interface ResendWebhookPayload {
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
    created_at?: string;
  };
}

export class ResendEventNormalizer {
  normalize(rawBody: unknown, headerEventId: string | null): NormalizedEmailEvent | null {
    if (!rawBody || typeof rawBody !== 'object') return null;
    const payload = rawBody as ResendWebhookPayload;

    const type = payload.type;
    if (!type) return null;

    const providerMessageId = payload.data?.email_id;
    if (!providerMessageId) return null;

    const normalizedStatus = RESEND_TO_NORMALIZED[type] ?? ProviderStatus.FAILED;

    const occurredAt = this.parseDate(payload.data?.created_at ?? payload.created_at);

    return {
      provider: EmailProvider.RESEND,
      providerMessageId,
      providerEventId: headerEventId,
      rawStatus: type,
      normalizedStatus,
      occurredAt,
      payload,
    };
  }

  private parseDate(value: string | undefined): Date {
    if (!value) return new Date();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }
}
