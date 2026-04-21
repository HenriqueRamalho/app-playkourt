export enum ProviderStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
  DELAYED = 'delayed',
  FAILED = 'failed',
}

const VALID_PROVIDER_STATUSES = new Set<string>([
  ProviderStatus.SENT,
  ProviderStatus.DELIVERED,
  ProviderStatus.OPENED,
  ProviderStatus.CLICKED,
  ProviderStatus.BOUNCED,
  ProviderStatus.COMPLAINED,
  ProviderStatus.DELAYED,
  ProviderStatus.FAILED,
]);

export function parseProviderStatus(value: string | null | undefined): ProviderStatus | null {
  if (!value) return null;
  return VALID_PROVIDER_STATUSES.has(value) ? (value as ProviderStatus) : null;
}
