'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { locationService, StateDTO, CityDTO } from '@/infrastructure/frontend-services/api/location.service';
import { goService, AvailableCourtDTO } from '@/infrastructure/frontend-services/api/go.service';
import { SportType, SPORT_TYPE_LABELS } from '@/domain/court/entity/court.interface';

const STORAGE_KEY = 'go:advanced-search';
const selectClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';

export default function AdvancedSearchPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [states, setStates] = useState<StateDTO[]>([]);
  const [cities, setCities] = useState<CityDTO[]>([]);
  const [stateId, setStateId] = useState<number | ''>('');
  const [cityId, setCityId] = useState<number | ''>('');
  const [sportType, setSportType] = useState<SportType | ''>('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loadingCities, setLoadingCities] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<AvailableCourtDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    locationService.listStates().then((loadedStates) => {
      setStates(loadedStates);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const s = JSON.parse(saved);
      if (s.stateId) {
        setStateId(s.stateId);
        setLoadingCities(true);
        locationService.listCitiesByState(s.stateId)
          .then((c) => { setCities(c); if (s.cityId) setCityId(s.cityId); })
          .catch(console.error)
          .finally(() => setLoadingCities(false));
      }
      if (s.sportType) setSportType(s.sportType);
      if (s.date) setDate(s.date);
      if (s.startTime) setStartTime(s.startTime);
      if (s.endTime) setEndTime(s.endTime);
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
    if (!cityId || !sportType || !date || !startTime || !endTime) return;
    setSearching(true);
    setError(null);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ stateId, cityId, sportType, date, startTime, endTime }));
    try {
      const data = await goService.searchAvailable({
        cityId: Number(cityId),
        sportType: sportType as SportType,
        date,
        startTime,
        endTime,
      });
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar quadras');
    } finally {
      setSearching(false);
    }
  };

  const handleSchedule = (courtId: string) => {
    if (!user) { router.push('/auth/login'); return; }
    router.push(`/go/scheduling/${courtId}`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Busca avançada</h1>
      <p className="text-gray-500 text-sm mb-8">Encontre quadras disponíveis para uma data e horário específicos.</p>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade <span className="text-red-500">*</span></label>
            <select value={sportType} onChange={(e) => setSportType(e.target.value as SportType)} required className={selectClass}>
              <option value="">Selecione</option>
              {Object.values(SportType).map((s) => <option key={s} value={s}>{SPORT_TYPE_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data <span className="text-red-500">*</span></label>
            <input type="date" required min={today} value={date} onChange={(e) => setDate(e.target.value)} className={selectClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horário de início <span className="text-red-500">*</span></label>
            <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className={selectClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horário de término <span className="text-red-500">*</span></label>
            <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className={selectClass} />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!cityId || !sportType || !date || !startTime || !endTime || searching}
            className="px-6 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searching ? 'Buscando...' : 'Buscar quadras disponíveis'}
          </button>
        </div>
      </form>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      {results !== null && (
        results.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center text-center">
            <span className="text-4xl mb-3">🔍</span>
            <p className="text-gray-500 text-sm">Nenhuma quadra disponível para esses critérios.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-3">{results.length} quadra{results.length !== 1 ? 's' : ''} disponível{results.length !== 1 ? 'is' : ''}</p>
            <ul className="space-y-3">
              {results.map((court) => (
                <li key={court.courtId} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-900 text-sm">{court.courtName}</span>
                    <span className="text-xs text-gray-500">{court.venueName} · {court.neighborhood} · {court.cityName}</span>
                    <span className="text-xs text-green-700 font-medium">
                      {SPORT_TYPE_LABELS[court.sportType]} · R$ {court.pricePerHour.toFixed(2)}/h
                    </span>
                    {court.description && <span className="text-xs text-gray-400">{court.description}</span>}
                  </div>
                  <button
                    onClick={() => handleSchedule(court.courtId)}
                    className="shrink-0 px-4 py-2 bg-green-700 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Reservar
                  </button>
                </li>
              ))}
            </ul>
          </>
        )
      )}
    </div>
  );
}
