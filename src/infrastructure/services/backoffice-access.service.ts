const BACKOFFICE_ALLOWED_EMAILS = new Set<string>([
  'hrd.ramalho@gmail.com',
  'adrianadossantosnayara@gmail.com',
]);

export const BackofficeAccessService = {
  hasAccess(email: string | null | undefined): boolean {
    if (!email) return false;
    return BACKOFFICE_ALLOWED_EMAILS.has(email.trim().toLowerCase());
  },
};
