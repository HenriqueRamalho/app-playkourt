import { faker } from '@faker-js/faker/locale/pt_BR';
import { CreateVenueDTO } from '@/infrastructure/frontend-services/api/venue.service';

const BRAZIL_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

export function generateFakeVenue(): CreateVenueDTO {
  return {
    name: `${faker.company.name()} Arena`,
    cnpj: faker.string.numeric(2) + '.' + faker.string.numeric(3) + '.' + faker.string.numeric(3) + '/' + faker.string.numeric(4) + '-' + faker.string.numeric(2),
    phone: `(${faker.string.numeric(2)}) ${faker.string.numeric(5)}-${faker.string.numeric(4)}`,
    street: faker.location.street(),
    number: faker.string.numeric({ length: { min: 1, max: 4 } }),
    complement: faker.helpers.maybe(() => faker.helpers.arrayElement(['Bloco A', 'Sala 1', 'Galpão 2', 'Térreo']), { probability: 0.4 }) ?? '',
    neighborhood: faker.location.county(),
    city: faker.location.city(),
    state: faker.helpers.arrayElement(BRAZIL_STATES),
    zipCode: faker.string.numeric(5) + '-' + faker.string.numeric(3),
  };
}
