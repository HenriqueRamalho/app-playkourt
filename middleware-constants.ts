export const VERCEL_DOMAIN = 'app-playkourt.vercel.app';

export const ALLOWED_ORIGINS = [
  'https://playkourt.com',
  `https://${VERCEL_DOMAIN}`,
  'http://localhost:3000',
  'https://localhost:3000',
  'https://localplaykourt.com:3000',
];

export const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
export const ALLOWED_HEADERS = ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'];

export const isOriginAllowed = (origin: string | null): boolean => {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith('.vercel.app') && origin.startsWith('https://')) return true;
  return false;
};
