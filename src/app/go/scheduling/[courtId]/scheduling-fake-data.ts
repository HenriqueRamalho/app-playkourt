import { faker } from '@faker-js/faker/locale/pt_BR';

export function generateFakeScheduling() {
  const date = faker.date.soon({ days: 30 });
  const hour = faker.number.int({ min: 6, max: 21 });
  const minutes = faker.helpers.arrayElement([0, 30]);

  return {
    date: date.toISOString().split('T')[0],
    startTime: `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    durationHours: faker.helpers.arrayElement([1, 1.5, 2, 2.5]),
  };
}
