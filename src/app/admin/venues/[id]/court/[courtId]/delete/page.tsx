'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { courtService, CourtDTO } from '@/infrastructure/frontend-services/api/court.service';
import { SPORT_TYPE_LABELS } from '@/domain/court/entity/court.interface';

export default function DeleteCourtPage() {
  const router = useRouter();
  const { id: venueId, courtId } = useParams<{ id: string; courtId: string }>();
  const { user, loading: authLoading } = useAuth();
  const [court, setCourt] = useState<CourtDTO | null>(null);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/auth/login'); return; }
    courtService.getById(venueId, courtId)
      .then(setCourt)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar quadra'))
      .finally(() => setFetching(false));
  }, [user, authLoading, router, venueId, courtId]);

  if (authLoading || fetching) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await courtService.delete(venueId, courtId);
      router.push(`/admin/venues/${venueId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir quadra');
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Link href={`/admin/venues/${venueId}`} className="text-sm text-gray-500 hover:text-gray-700">← Voltar para o local</Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      {court && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 max-w-lg">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Excluir quadra</h1>
          <p className="text-sm text-gray-500 mb-6">Esta ação é irreversível. A quadra será permanentemente removida.</p>

          <div className="bg-gray-50 rounded-lg border border-gray-200 px-5 py-4 mb-8">
            <p className="font-medium text-gray-900">{court.name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{SPORT_TYPE_LABELS[court.sportType]}</p>
            <p className="text-sm text-gray-500 mt-0.5">R$ {court.pricePerHour.toFixed(2)}/h</p>
            {court.description && <p className="text-sm text-gray-400 mt-0.5">{court.description}</p>}
            <span className={`mt-2 inline-block text-xs font-medium px-2 py-1 rounded-full ${court.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {court.isActive ? 'Ativa' : 'Inativa'}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="button" onClick={handleDelete} disabled={loading} className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Excluindo...' : 'Confirmar exclusão'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
