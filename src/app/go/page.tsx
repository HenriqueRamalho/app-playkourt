'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { locationService, StateDTO, CityDTO } from '@/infrastructure/frontend-services/api/location.service';
import { goService, VenueSearchResultDTO } from '@/infrastructure/frontend-services/api/go.service';
import { SportType, SPORT_TYPE_LABELS } from '@/domain/court/entity/court.interface';
import { useEffect } from 'react';

const selectClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';

export default function GoPage() {
  const { user } = useAuth();
  const router = useRouter();

  const STORAGE_KEY = 'go:last-search';

  const [states, setStates] = useState<StateDTO[]>([]);
  const [cities, setCities] = useState<CityDTO[]>([]);
  const [stateId, setStateId] = useState<number | ''>('');
  const [cityId, setCityId] = useState<number | ''>('');
  const [neighborhood, setNeighborhood] = useState('');
  const [sportType, setSportType] = useState<SportType | ''>('');
  const [loadingCities, setLoadingCities] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<VenueSearchResultDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    locationService.listStates().then((loadedStates) => {
      setStates(loadedStates);

      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const { stateId: sId, cityId: cId, neighborhood: nb, sportType: st } = JSON.parse(saved);

      if (sId) {
        setStateId(sId);
        setLoadingCities(true);
        locationService.listCitiesByState(sId)
          .then((loadedCities) => {
            setCities(loadedCities);
            if (cId) setCityId(cId);
          })
          .catch(console.error)
          .finally(() => setLoadingCities(false));
      }
      if (nb) setNeighborhood(nb);
      if (st) setSportType(st);
    }).catch(console.error);
  }, []);

  const handleStateChange = (id: number) => {
    setStateId(id);
    setCityId('');
    setCities([]);
    setLoadingCities(true);
    locationService.listCitiesByState(id)
      .then(setCities)
      .catch(console.error)
      .finally(() => setLoadingCities(false));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityId) return;
    setSearching(true);
    setError(null);
    try {
      const filters = { cityId: Number(cityId), neighborhood: neighborhood || undefined, sportType: (sportType as SportType) || undefined };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ stateId, cityId, neighborhood, sportType }));
      const data = await goService.searchCourts(filters);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar quadras');
    } finally {
      setSearching(false);
    }
  };

  const handleSchedule = (venueId: string) => {
    if (!user) { router.push('/auth/login'); return; }
    router.push(`/go/venue/${venueId}/scheduling`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Explorar quadras</h1>
      <p className="text-gray-500 text-sm mb-8">Encontre e reserve quadras perto de você.</p>

      <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado <span className="text-red-500">*</span></label>
            <select value={stateId} onChange={(e) => handleStateChange(Number(e.target.value))} required className={selectClass}>
              <option value="">Selecione</option>
              {states.map((s) => <option key={s.id} value={s.id}>{s.uf} — {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade <span className="text-red-500">*</span></label>
            <select value={cityId} onChange={(e) => setCityId(Number(e.target.value))} required disabled={!stateId || loadingCities} className={selectClass}>
              <option value="">{loadingCities ? 'Carregando...' : 'Selecione'}</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
            <input
              type="text"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Ex: Centro"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade</label>
            <select value={sportType} onChange={(e) => setSportType(e.target.value as SportType | '')} className={selectClass}>
              <option value="">Todas</option>
              {Object.values(SportType).map((s) => <option key={s} value={s}>{SPORT_TYPE_LABELS[s]}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!cityId || searching}
            className="px-6 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searching ? 'Buscando...' : 'Buscar quadras'}
          </button>
        </div>
      </form>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      {results !== null && (
        results.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center text-center">
            <span className="text-4xl mb-3">🔍</span>
            <p className="text-gray-500 text-sm">Nenhuma quadra encontrada com esses filtros.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {results.map((venue) => (
              <li key={venue.venueId} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-gray-900 text-sm">{venue.venueName}</span>
                  <span className="text-xs text-gray-500">
                    {[venue.street, venue.number].filter(Boolean).join(', ')}{venue.neighborhood ? ` - ${venue.neighborhood}` : ''}{venue.cityName ? ` - ${venue.cityName}` : ''}
                  </span>
                  <span className="text-xs text-green-700">
                    {venue.sports.map((s) => `${SPORT_TYPE_LABELS[s.sportType]} (${s.count} ${s.count === 1 ? 'quadra' : 'quadras'})`).join(' | ')}
                  </span>
                </div>
                <button
                  onClick={() => handleSchedule(venue.venueId)}
                  className="shrink-0 px-4 py-2 bg-green-700 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors"
                >
                  Agendar
                </button>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
