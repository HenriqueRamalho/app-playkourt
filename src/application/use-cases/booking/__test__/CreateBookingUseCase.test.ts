import { CreateBookingUseCase } from '@/application/use-cases/booking/CreateBookingUseCase';
import { BookingRepositoryInterface } from '@/domain/booking/repository/booking-repository.interface';
import { Booking, BookingStatus } from '@/domain/booking/entity/booking.interface';
import { BusinessHours } from '@/domain/venue/entity/venue.interface';

const makeRepository = (overrides?: Partial<BookingRepositoryInterface>): BookingRepositoryInterface => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findByCourtId: jest.fn(),
  findByVenueId: jest.fn(),
  updateStatus: jest.fn(),
  ...overrides,
});

const makeBusinessHours = (overrides: Partial<BusinessHours>[] = []): BusinessHours[] =>
  [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
    const override = overrides.find((o) => o.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek: dayOfWeek as BusinessHours['dayOfWeek'],
      openTime: '08:00',
      closeTime: '22:00',
      isClosed: dayOfWeek === 0,
      ...override,
    };
  });

// 2025-06-02 = segunda-feira
const validInput = {
  courtId: 'court-1',
  userId: 'user-1',
  date: '2025-06-02',
  startTime: '10:00',
  durationHours: 1,
  businessHours: makeBusinessHours(),
};

const fakeBooking: Booking = {
  id: 'booking-1',
  courtId: validInput.courtId,
  userId: validInput.userId,
  date: validInput.date,
  startTime: validInput.startTime,
  durationHours: validInput.durationHours,
  status: BookingStatus.PENDING,
  createdAt: new Date(),
};

describe('CreateBookingUseCase', () => {
  describe('basic validations', () => {
    it('creates a booking with status pending', async () => {
      const repository = makeRepository({ create: jest.fn().mockResolvedValue(fakeBooking) });
      const useCase = new CreateBookingUseCase(repository);

      const result = await useCase.execute(validInput);

      expect(result.status).toBe(BookingStatus.PENDING);
    });

    it('throws if date is missing', async () => {
      const useCase = new CreateBookingUseCase(makeRepository());
      await expect(useCase.execute({ ...validInput, date: '' })).rejects.toThrow('Date is required');
    });

    it('throws if startTime is missing', async () => {
      const useCase = new CreateBookingUseCase(makeRepository());
      await expect(useCase.execute({ ...validInput, startTime: '' })).rejects.toThrow('Start time is required');
    });

    it('throws if durationHours is less than 1', async () => {
      const useCase = new CreateBookingUseCase(makeRepository());
      await expect(useCase.execute({ ...validInput, durationHours: 0 })).rejects.toThrow('Duration must be between 1 and 4 hours');
    });

    it('throws if durationHours is greater than 4', async () => {
      const useCase = new CreateBookingUseCase(makeRepository());
      await expect(useCase.execute({ ...validInput, durationHours: 5 })).rejects.toThrow('Duration must be between 1 and 4 hours');
    });
  });

  describe('business hours validation', () => {
    it('throws if the day is closed', async () => {
      const useCase = new CreateBookingUseCase(makeRepository());
      // 2025-06-08 = domingo (fechado por default)
      await expect(useCase.execute({ ...validInput, date: '2025-06-08' }))
        .rejects.toThrow('Domingos');
    });

    it('throws if slot starts before opening time', async () => {
      const useCase = new CreateBookingUseCase(makeRepository());
      await expect(useCase.execute({ ...validInput, startTime: '07:00' }))
        .rejects.toThrow('período de funcionamento');
    });

    it('throws if slot ends after closing time', async () => {
      const useCase = new CreateBookingUseCase(makeRepository());
      await expect(useCase.execute({ ...validInput, startTime: '21:30', durationHours: 1 }))
        .rejects.toThrow('período de funcionamento');
    });

    it('accepts a slot that ends exactly at closing time', async () => {
      const repository = makeRepository({ create: jest.fn().mockResolvedValue(fakeBooking) });
      const useCase = new CreateBookingUseCase(repository);
      await expect(useCase.execute({ ...validInput, startTime: '21:00', durationHours: 1 }))
        .resolves.toBeDefined();
    });

    it('does not pass businessHours to the repository', async () => {
      const createMock = jest.fn().mockResolvedValue(fakeBooking);
      const useCase = new CreateBookingUseCase(makeRepository({ create: createMock }));
      await useCase.execute(validInput);

      expect(createMock).toHaveBeenCalledWith(
        expect.not.objectContaining({ businessHours: expect.anything() })
      );
    });
  });
});
