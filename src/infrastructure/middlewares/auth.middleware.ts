import { NextRequest, NextResponse } from 'next/server';
import { AuthService, AuthUser } from '@/infrastructure/frontend-services/auth/auth.service';
import { VenueAccessService } from '@/infrastructure/services/venue-access.service';

export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>,
): Promise<NextResponse> {
  const user = await AuthService.getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return handler(req, user);
}

export async function withVenueAccess(
  req: NextRequest,
  venueId: string,
  handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>,
): Promise<NextResponse> {
  return withAuth(req, async (req, user) => {
    const hasAccess = await VenueAccessService.hasAccess(user.id, venueId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return handler(req, user);
  });
}
