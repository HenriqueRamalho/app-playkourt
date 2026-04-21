export enum EmailProvider {
  RESEND = 'resend',
  SES = 'ses',
  NOOP = 'noop',
}

const VALID_PROVIDERS = new Set<string>([
  EmailProvider.RESEND,
  EmailProvider.SES,
  EmailProvider.NOOP,
]);

export function parseEmailProvider(value: string | null | undefined): EmailProvider | null {
  if (!value) return null;
  return VALID_PROVIDERS.has(value) ? (value as EmailProvider) : null;
}
