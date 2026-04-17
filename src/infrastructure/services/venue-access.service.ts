import { unstable_cache } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb } from '@/infrastructure/database/drizzle/client';
import { venueMembers } from '@/infrastructure/database/drizzle/schema';

// Cache dos venue IDs que o usuário tem acesso, com TTL de 60 segundos.
// Evita um SELECT em venue_members a cada request autenticada.
const getCachedVenueIds = (userId: string) =>
  unstable_cache(
    async () => {
      const rows = await getDb()
        .select({ venueId: venueMembers.venueId })
        .from(venueMembers)
        .where(eq(venueMembers.userId, userId));
      return rows.map((row) => row.venueId);
    },
    [`venue-access-${userId}`],
    { revalidate: 60 }
  )();

export const VenueAccessService = {
  async hasAccess(userId: string, venueId: string): Promise<boolean> {
    const venueIds = await getCachedVenueIds(userId);
    return venueIds.includes(venueId);
  },
};
