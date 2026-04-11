import { type NextRequest, NextResponse } from 'next/server';
import { ALLOWED_HEADERS, ALLOWED_METHODS, isOriginAllowed } from './middleware-constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/(.*)'],
};
