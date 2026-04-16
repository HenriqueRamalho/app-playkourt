import { unstable_cache } from 'next/cache';
import { supabase } from '@/infrastructure/database/supabase/server/client';

// Cache dos venue IDs que o usuário tem acesso, com TTL de 60 segundos.
// Evita um SELECT em venue_members a cada request autenticada.
const getCachedVenueIds = (userId: string) =>
  unstable_cache(
    async () => {
      const { data, error } = await supabase
        .from('venue_members')
        .select('venue_id')
        .eq('user_id', userId);

      if (error) throw error;
      return data.map((row: { venue_id: string }) => row.venue_id);
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
