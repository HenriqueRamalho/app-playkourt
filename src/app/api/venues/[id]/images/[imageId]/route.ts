import { type NextRequest } from 'next/server';
import { withVenueAccess } from '@/infrastructure/middlewares/auth.middleware';
import { VenueImageController } from '@/infrastructure/controllers/venue-image.controller';

type Params = { params: Promise<{ id: string; imageId: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id, imageId } = await params;
  return withVenueAccess(req, id, (r, user) =>
    VenueImageController.detach(r, user, id, imageId),
  );
}
