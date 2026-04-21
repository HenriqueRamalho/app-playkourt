export enum EmailStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  SUPPRESSED_IN_ENV = 'suppressed_in_env',
}

const VALID_STATUSES = new Set<string>([
  EmailStatus.QUEUED,
  EmailStatus.SENT,
  EmailStatus.DELIVERED,
  EmailStatus.FAILED,
  EmailStatus.SUPPRESSED_IN_ENV,
]);

export function parseEmailStatus(value: string | null | undefined): EmailStatus {
  if (value && VALID_STATUSES.has(value)) return value as EmailStatus;
  return EmailStatus.QUEUED;
}
