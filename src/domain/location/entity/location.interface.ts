export interface State {
  id: number;
  uf: string;
  name: string;
}

export interface City {
  id: number;
  name: string;
  stateId: number;
}
