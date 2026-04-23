import { type NextRequest } from 'next/server';
import { withVenueAccess } from '@/infrastructure/middlewares/auth.middleware';
import { VenueImageController } from '@/infrastructure/controllers/venue-image.controller';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return withVenueAccess(req, id, (r, user) => VenueImageController.reorder(r, user, id));
}
