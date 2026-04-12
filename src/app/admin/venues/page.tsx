'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { venueService, VenueDTO } from '@/infrastructure/frontend-services/api/venue.service';

export default function AdminVenueListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [venues, setVenues] = useState<VenueDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/auth/login'); return; }

    venueService.list()
      .then(setVenues)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar venues'))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading) return null;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus locais</h1>
          <p className="mt-1 text-sm text-gray-500">Locais e quadras que você gerencia.</p>
        </div>
        <Link
          href="/admin/venues/new"
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          Novo local
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {venues.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-gray-500 text-sm">Você ainda não possui nenhum local.</p>
          <Link href="/admin/venues/new" className="mt-4 inline-block text-sm text-green-600 hover:text-green-500">
            Criar primeiro local →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {venues.map((venue) => (
            <li key={venue.id} className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{venue.name}</p>
                <p className="text-sm text-gray-500">{venue.cityName}, {venue.stateUf}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${venue.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {venue.isActive ? 'Ativo' : 'Inativo'}
                </span>
                <Link href={`/admin/venues/${venue.id}/edit`} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Editar
                </Link>
                <Link href={`/admin/venues/${venue.id}/delete`} className="text-sm font-medium text-red-500 hover:text-red-700">
                  Excluir
                </Link>
                <Link href={`/admin/venues/${venue.id}`} className="text-sm font-medium text-green-600 hover:text-green-500">
                  Ver detalhes →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
