export interface ProcessedEmailListDTO {
  id: string;
  provider: string;
  providerMessageId: string | null;
  to: string;
  recipientUserId: string | null;
  from: string;
  subject: string;
  templateName: string | null;
  status: string;
  lastProviderStatus: string | null;
  lastProviderStatusAt: string | null;
  createdAt: string;
  resentFromId: string | null;
}

export interface ProcessedEmailListResponse {
  data: ProcessedEmailListDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProcessedEmailEventDTO {
  id: string;
  provider: string;
  providerEventId: string | null;
  rawStatus: string;
  normalizedStatus: string;
  occurredAt: string;
  receivedAt: string;
}

export interface ProcessedEmailDetailDTO {
  id: string;
  provider: string;
  providerMessageId: string | null;
  to: string;
  recipientUserId: string | null;
  from: string;
  cc: string[] | null;
  bcc: string[] | null;
  replyTo: string | null;
  subject: string;
  htmlBody: string;
  textBody: string | null;
  tags: string[] | null;
  metadata: Record<string, string | number | boolean>;
  templateName: string | null;
  status: string;
  lastProviderStatus: string | null;
  lastProviderStatusAt: string | null;
  lastProviderError: string | null;
  resentFromId: string | null;
  resentByUserId: string | null;
  createdAt: string;
  deliveredAt: string | null;
  events: ProcessedEmailEventDTO[];
}

export interface Filters {
  sentFrom: string;
  sentTo: string;
  to: string;
  subject: string;
  from: string;
  recipientUserId: string;
  metadataKey: string;
  metadataValue: string;
  provider: string;
  status: string;
}

export const EMPTY_FILTERS: Filters = {
  sentFrom: '',
  sentTo: '',
  to: '',
  subject: '',
  from: '',
  recipientUserId: '',
  metadataKey: '',
  metadataValue: '',
  provider: '',
  status: '',
};

export const PROVIDER_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'resend', label: 'Resend' },
  { value: 'ses', label: 'SES' },
  { value: 'noop', label: 'Noop (dev/staging)' },
];

export const PROVIDER_STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'sent', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'opened', label: 'Aberto' },
  { value: 'clicked', label: 'Clicado' },
  { value: 'bounced', label: 'Devolvido' },
  { value: 'complained', label: 'Spam/Complaint' },
  { value: 'delayed', label: 'Atrasado' },
  { value: 'failed', label: 'Falhou' },
];

export const PROVIDER_STATUS_LABELS: Record<string, string> = {
  sent: 'Enviado',
  delivered: 'Entregue',
  opened: 'Aberto',
  clicked: 'Clicado',
  bounced: 'Devolvido',
  complained: 'Spam/Complaint',
  delayed: 'Atrasado',
  failed: 'Falhou',
};

export const STATUS_LABELS: Record<string, string> = {
  queued: 'Enfileirado',
  sent: 'Enviado',
  delivered: 'Entregue',
  failed: 'Falhou',
  suppressed_in_env: 'Suprimido (dev/staging)',
};

export const PROVIDER_LABELS: Record<string, string> = {
  resend: 'Resend',
  ses: 'SES',
  noop: 'Noop',
};
