export const rootDomain = 'playkourt.com';
export const localRootDomain = 'localplaykourt.com';

export const SUBDOMAINS = ['admin', 'play', 'backoffice'] as const;
export type Subdomain = typeof SUBDOMAINS[number];

export const VERCEL_DOMAIN = 'app-playkourt.vercel.app';

export const ALLOWED_ORIGINS = [
  `https://${rootDomain}`,
  `https://${VERCEL_DOMAIN}`,
  `https://${localRootDomain}:3000`,
  ...SUBDOMAINS.map((s) => `https://${s}.${rootDomain}`),
  ...SUBDOMAINS.map((s) => `https://${s}.${localRootDomain}:3000`),
];

export const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
export const ALLOWED_HEADERS = ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'];

export const isOriginAllowed = (origin: string | null): boolean => {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith(`.${rootDomain}`) && origin.startsWith('https://')) return true;
  if (origin.endsWith(`.${localRootDomain}:3000`) && origin.startsWith('https://')) return true;
  // Allow Vercel preview deployments (e.g. app-playkourt-git-branch.vercel.app)
  if (origin.endsWith('.vercel.app') && origin.startsWith('https://')) return true;
  return false;
};
