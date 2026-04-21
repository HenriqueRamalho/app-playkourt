export const DEFAULT_FROM_ADDRESS = 'Playkourt <noreply@playkourt.com>';

export const ALLOWED_SENDER_DOMAINS: readonly string[] = ['playkourt.com'];

const EMAIL_ADDRESS_REGEX = /<([^>]+)>/;

export function extractEmailAddress(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const match = trimmed.match(EMAIL_ADDRESS_REGEX);
  const address = match ? match[1].trim() : trimmed;
  if (!address.includes('@')) return null;
  return address.toLowerCase();
}

export function extractEmailDomain(raw: string): string | null {
  const address = extractEmailAddress(raw);
  if (!address) return null;
  const parts = address.split('@');
  if (parts.length !== 2) return null;
  return parts[1];
}

export function isAllowedSenderDomain(raw: string): boolean {
  const domain = extractEmailDomain(raw);
  if (!domain) return false;
  return ALLOWED_SENDER_DOMAINS.includes(domain);
}
