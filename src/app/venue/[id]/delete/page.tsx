'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { venueService, VenueDTO } from '@/infrastructure/frontend-services/api/venue.service';

export default function DeleteVenuePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [venue, setVenue] = useState<VenueDTO | null>(null);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    venueService.getById(id)
      .then(setVenue)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar venue'))
      .finally(() => setFetching(false));
  }, [user, authLoading, router, id]);

  if (authLoading || fetching) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await venueService.delete(id);
      router.push('/venue');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir venue');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <Link href="/venue" className="text-sm text-gray-500 hover:text-gray-700">
            ← Voltar para venues
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {venue && (
          <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Excluir venue</h1>
            <p className="text-sm text-gray-500 mb-6">Esta ação é irreversível. Todos os dados associados serão perdidos.</p>

            <div className="bg-gray-50 rounded-lg border border-gray-200 px-5 py-4 mb-8">
              <p className="font-medium text-gray-900">{venue.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{venue.cityName}, {venue.stateUf}</p>
              {venue.cnpj && <p className="text-sm text-gray-500 mt-0.5">CNPJ: {venue.cnpj}</p>}
              {venue.phone && <p className="text-sm text-gray-500 mt-0.5">Telefone: {venue.phone}</p>}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Excluindo...' : 'Confirmar exclusão'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
