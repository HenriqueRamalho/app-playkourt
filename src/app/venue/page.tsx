'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { venueService, VenueDTO } from '@/infrastructure/frontend-services/api/venue.service';

export default function VenueListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [venues, setVenues] = useState<VenueDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    venueService.list()
      .then(setVenues)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar venues'))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Venues</h1>
            <p className="mt-1 text-sm text-gray-500">Locais aos quais você tem acesso.</p>
          </div>
          <Link
            href="/venue/new"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Novo venue
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {venues.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <p className="text-gray-500 text-sm">Você ainda não possui nenhum venue.</p>
            <Link href="/venue/new" className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-500">
              Criar primeiro venue →
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {venues.map((venue) => (
              <li key={venue.id} className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{venue.name}</p>
                  <p className="text-sm text-gray-500">{venue.city}, {venue.state}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${venue.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {venue.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                  <Link
                    href={`/venue/${venue.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Ver detalhes →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
