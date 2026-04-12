'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { venueService, VenueDTO } from '@/infrastructure/frontend-services/api/venue.service';
import { courtService, CourtDTO } from '@/infrastructure/frontend-services/api/court.service';
import { SPORT_TYPE_LABELS } from '@/domain/court/entity/court.interface';

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

export default function AdminVenueDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [venue, setVenue] = useState<VenueDTO | null>(null);
  const [courts, setCourts] = useState<CourtDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/auth/login'); return; }

    Promise.all([venueService.getById(id), courtService.listByVenue(id)])
      .then(([venueData, courtsData]) => { setVenue(venueData); setCourts(courtsData); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar dados'))
      .finally(() => setLoading(false));
  }, [user, authLoading, router, id]);

  if (authLoading || loading) return null;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/venues" className="text-sm text-gray-500 hover:text-gray-700">← Voltar para meus locais</Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>
      )}

      {venue && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{venue.name}</h1>
                <p className="mt-1 text-sm text-gray-500">{venue.cityName}, {venue.stateUf}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${venue.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {venue.isActive ? 'Ativo' : 'Inativo'}
                </span>
                <Link href={`/admin/venues/${venue.id}/court/add`} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                  + Adicionar quadra
                </Link>
                <Link href={`/admin/venues/${venue.id}/reservations`} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Reservas
                </Link>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <DetailRow label="CNPJ" value={venue.cnpj} />
              <DetailRow label="Telefone" value={venue.phone} />
              <DetailRow label="CEP" value={venue.zipCode} />
              <DetailRow label="Rua" value={venue.street} />
              <DetailRow label="Número" value={venue.number} />
              <DetailRow label="Complemento" value={venue.complement} />
              <DetailRow label="Bairro" value={venue.neighborhood} />
              <DetailRow label="Cidade" value={venue.cityName} />
              <DetailRow label="Estado" value={`${venue.stateUf} — ${venue.stateName}`} />
            </dl>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Quadras ({courts.length})
            </h2>

            {courts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                <p className="text-sm text-gray-500">Nenhuma quadra cadastrada ainda.</p>
                <Link href={`/admin/venues/${venue.id}/court/add`} className="mt-3 inline-block text-sm text-green-600 hover:text-green-700">
                  Cadastrar primeira quadra →
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {courts.map((court) => (
                  <li key={court.id} className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{court.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {SPORT_TYPE_LABELS[court.sportType]} · R$ {court.pricePerHour.toFixed(2)}/h
                      </p>
                      {court.description && <p className="text-sm text-gray-400 mt-0.5">{court.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${court.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {court.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                      <Link href={`/admin/venues/${venue.id}/court/${court.id}/edit`} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                        Editar
                      </Link>
                      <Link href={`/admin/venues/${venue.id}/court/${court.id}/delete`} className="text-sm font-medium text-red-500 hover:text-red-700">
                        Excluir
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
