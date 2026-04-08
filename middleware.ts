import { type NextRequest, NextResponse } from 'next/server';
import {
  ALLOWED_HEADERS,
  ALLOWED_METHODS,
  isOriginAllowed,
  localRootDomain,
  rootDomain,
  SUBDOMAINS,
  type Subdomain,
} from './middleware-constants';

function extractSubdomain(request: NextRequest): Subdomain | null {
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];

  const isLocal = hostname.endsWith(`.${localRootDomain}`);
  const isProd = hostname.endsWith(`.${rootDomain}`);

  if (!isLocal && !isProd) return null;

  const sub = isLocal
    ? hostname.replace(`.${localRootDomain}`, '')
    : hostname.replace(`.${rootDomain}`, '');

  return (SUBDOMAINS as readonly string[]).includes(sub) ? (sub as Subdomain) : null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CORS for API routes
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const originAllowed = isOriginAllowed(origin);

    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });
      if (originAllowed && origin) response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
      response.headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Max-Age', '86400');
      return response;
    }

    const response = NextResponse.next();
    if (originAllowed && origin) response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
    response.headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    return response;
  }

  // Subdomain routing
  const subdomain = extractSubdomain(request);

  if (subdomain) {
    const response = NextResponse.next();
    response.headers.set('x-subdomain', subdomain);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|[\\w-]+\\.\\w+).*)'],
};
