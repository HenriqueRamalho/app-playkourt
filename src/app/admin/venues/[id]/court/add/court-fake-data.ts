import { faker } from '@faker-js/faker/locale/pt_BR';
import { CreateCourtDTO } from '@/infrastructure/frontend-services/api/court.service';
import { SportType } from '@/domain/court/entity/court.interface';

export function generateFakeCourt(): CreateCourtDTO {
  return {
    name: `Quadra ${faker.number.int({ min: 1, max: 20 })}`,
    sportType: faker.helpers.arrayElement(Object.values(SportType)),
    description: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.6 }) ?? '',
    pricePerHour: Number(faker.commerce.price({ min: 40, max: 300, dec: 2 })),
  };
}
