'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { goService, VenueDetailDTO } from '@/infrastructure/frontend-services/api/go.service';
import { SportType, SPORT_TYPE_LABELS } from '@/domain/court/entity/court.interface';
import { DAY_OF_WEEK_LABELS } from '@/domain/venue/entity/venue.interface';

export default function VenueSchedulingPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const router = useRouter();

  const [detail, setDetail] = useState<VenueDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState<SportType | 'all'>('all');

  useEffect(() => {
    goService.getVenueWithCourts(venueId)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar venue'))
      .finally(() => setLoading(false));
  }, [venueId]);

  if (loading) return null;

  const { venue, courts } = detail ?? { venue: null, courts: [] };

  const availableSports = [...new Set(courts.map((c) => c.sportType))];
  const filtered = sportFilter === 'all' ? courts : courts.filter((c) => c.sportType === sportFilter);

  const address = [venue?.street, venue?.number].filter(Boolean).join(', ');
  const addressLine = [address, venue?.neighborhood, venue?.cityName, venue?.stateUf].filter(Boolean).join(' - ');

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/go" className="text-sm text-gray-500 hover:text-gray-700">← Voltar para busca</Link>

      {error && <div className="mt-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      {venue && (
        <>
          <div className="mt-6 mb-8">
            <h1 className="text-2xl font-bold text-gray-900">{venue.name}</h1>
            {addressLine && <p className="mt-1 text-sm text-gray-500">{addressLine}</p>}
            {venue.phone && <p className="mt-0.5 text-sm text-gray-500">{venue.phone}</p>}

            {venue.businessHours?.length > 0 && (
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Horário de funcionamento</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
                  {venue.businessHours.map((h) => (
                    <div key={h.dayOfWeek} className="flex items-center justify-start text-sm">
                      <span className="text-gray-500 mr-2">{DAY_OF_WEEK_LABELS[h.dayOfWeek]}</span>
                      {h.isClosed
                        ? <span className="text-red-400 text-xs">Fechado</span>
                        : <span className="text-gray-700 text-xs">{h.openTime} – {h.closeTime}</span>
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <button
              onClick={() => setSportFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sportFilter === 'all' ? 'bg-green-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              Todas
            </button>
            {availableSports.map((sport) => (
              <button
                key={sport}
                onClick={() => setSportFilter(sport)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sportFilter === sport ? 'bg-green-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {SPORT_TYPE_LABELS[sport]}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center text-center">
              <span className="text-4xl mb-3">🏟️</span>
              <p className="text-gray-500 text-sm">Nenhuma quadra disponível para esta modalidade.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((court) => (
                <li key={court.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-900 text-sm">{court.name}</span>
                    <span className="text-xs text-green-700 font-medium">{SPORT_TYPE_LABELS[court.sportType]}</span>
                    {court.description && <span className="text-xs text-gray-400">{court.description}</span>}
                    <span className="text-xs text-gray-500">R$ {court.pricePerHour.toFixed(2)}/h</span>
                  </div>
                  <button
                    onClick={() => router.push(`/go/scheduling/${court.id}`)}
                    className="shrink-0 px-4 py-2 bg-green-700 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Reservar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
