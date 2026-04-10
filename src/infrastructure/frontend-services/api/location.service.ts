export interface StateDTO {
  id: number;
  uf: string;
  name: string;
}

export interface CityDTO {
  id: number;
  name: string;
  stateId: number;
}

export const locationService = {
  async listStates(): Promise<StateDTO[]> {
    const res = await fetch('/api/states');
    if (!res.ok) throw new Error('Failed to load states');
    return res.json();
  },

  async listCitiesByState(stateId: number): Promise<CityDTO[]> {
    const res = await fetch(`/api/states/${stateId}/cities`);
    if (!res.ok) throw new Error('Failed to load cities');
    return res.json();
  },
};
