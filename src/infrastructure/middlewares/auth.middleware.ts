import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/infrastructure/frontend-services/auth/auth.service';
import { VenueAccessService } from '@/infrastructure/services/venue-access.service';

export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: { id: string; email: string }) => Promise<NextResponse>
): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'No authorization header' }, { status: 401 });

  const token = authHeader.replace('Bearer ', '');
  const user = await AuthService.getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  return handler(req, user);
}

export async function withVenueAccess(
  req: NextRequest,
  venueId: string,
  handler: (req: NextRequest, user: { id: string; email: string }) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(req, async (req, user) => {
    const hasAccess = await VenueAccessService.hasAccess(user.id, venueId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return handler(req, user);
  });
}
