import { faker } from '@faker-js/faker/locale/pt_BR';
import { CreateVenueDTO } from '@/infrastructure/frontend-services/api/venue.service';

// Alguns municípios reais para testes (código IBGE → estado)
const SAMPLE_CITIES: { cityId: number; stateId: number }[] = [
  { cityId: 3550308, stateId: 35 }, // São Paulo - SP
  { cityId: 3106200, stateId: 31 }, // Belo Horizonte - MG
  { cityId: 3304557, stateId: 33 }, // Rio de Janeiro - RJ
  { cityId: 4106902, stateId: 41 }, // Curitiba - PR
  { cityId: 4314902, stateId: 43 }, // Porto Alegre - RS
  { cityId: 5300108, stateId: 53 }, // Brasília - DF
  { cityId: 2927408, stateId: 29 }, // Salvador - BA
  { cityId: 2304400, stateId: 23 }, // Fortaleza - CE
];

export function generateFakeVenue(): CreateVenueDTO {
  const location = faker.helpers.arrayElement(SAMPLE_CITIES);
  return {
    name: `${faker.company.name()} Arena`,
    cnpj: faker.string.numeric(2) + '.' + faker.string.numeric(3) + '.' + faker.string.numeric(3) + '/' + faker.string.numeric(4) + '-' + faker.string.numeric(2),
    phone: `(${faker.string.numeric(2)}) ${faker.string.numeric(5)}-${faker.string.numeric(4)}`,
    street: faker.location.street(),
    number: faker.string.numeric({ length: { min: 1, max: 4 } }),
    complement: faker.helpers.maybe(() => faker.helpers.arrayElement(['Bloco A', 'Sala 1', 'Galpão 2', 'Térreo']), { probability: 0.4 }) ?? '',
    neighborhood: faker.location.county(),
    cityId: location.cityId,
    stateId: location.stateId,
    zipCode: faker.string.numeric(5) + '-' + faker.string.numeric(3),
  };
}
