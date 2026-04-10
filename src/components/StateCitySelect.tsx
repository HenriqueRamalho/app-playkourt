'use client';

import { useEffect, useState } from 'react';
import { locationService, StateDTO, CityDTO } from '@/infrastructure/frontend-services/api/location.service';

interface Props {
  stateId: number | '';
  cityId: number | '';
  onStateChange: (stateId: number) => void;
  onCityChange: (cityId: number) => void;
}

export default function StateCitySelect({ stateId, cityId, onStateChange, onCityChange }: Props) {
  const [states, setStates] = useState<StateDTO[]>([]);
  const [cities, setCities] = useState<CityDTO[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    locationService.listStates().then(setStates).catch(console.error);
  }, []);

  useEffect(() => {
    if (!stateId) {
      setCities([]);
      return;
    }
    setLoadingCities(true);
    locationService.listCitiesByState(Number(stateId))
      .then(setCities)
      .catch(console.error)
      .finally(() => setLoadingCities(false));
  }, [stateId]);

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent';

  return (
    <>
      <div>
        <label htmlFor="stateId" className="block text-sm font-medium text-gray-700 mb-1">
          Estado <span className="text-red-500">*</span>
        </label>
        <select
          id="stateId"
          required
          value={stateId}
          onChange={(e) => { onStateChange(Number(e.target.value)); onCityChange(0); }}
          className={`${inputClass} ${!stateId ? 'text-gray-500' : 'text-gray-900'}`}
        >
          <option value="">Selecione</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>{s.uf} — {s.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cityId" className="block text-sm font-medium text-gray-700 mb-1">
          Cidade <span className="text-red-500">*</span>
        </label>
        <select
          id="cityId"
          required
          value={cityId}
          onChange={(e) => onCityChange(Number(e.target.value))}
          disabled={!stateId || loadingCities}
          className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed ${!cityId ? 'text-gray-500' : 'text-gray-900'}`}
        >
          <option value="">{loadingCities ? 'Carregando...' : 'Selecione'}</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
    </>
  );
}
