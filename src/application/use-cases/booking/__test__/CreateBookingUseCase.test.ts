import { CreateBookingUseCase } from '@/application/use-cases/booking/CreateBookingUseCase';
import { BookingRepositoryInterface } from '@/domain/booking/repository/booking-repository.interface';
import { Booking, BookingStatus } from '@/domain/booking/entity/booking.interface';
import { BusinessHours } from '@/domain/venue/entity/venue.interface';

const makeRepository = (overrides?: Partial<BookingRepositoryInterface>): BookingRepositoryInterface => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findByCourtId: jest.fn(),
  findActiveByCourtAndDate: jest.fn().mockResolvedValue([]),
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
  dateExceptions: [],
  recurringBlocks: [],
  isCourtActive: true,
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

    it('throws if court is inactive', async () => {
      const useCase = new CreateBookingUseCase(makeRepository());
      await expect(useCase.execute({ ...validInput, isCourtActive: false }))
        .rejects.toThrow('não está disponível');
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

  describe('conflict validation', () => {
    it('throws if the slot conflicts with an existing booking', async () => {
      const conflictingBooking: Booking = {
        ...fakeBooking, startTime: '10:00', durationHours: 1,
      };
      const repository = makeRepository({
        findActiveByCourtAndDate: jest.fn().mockResolvedValue([conflictingBooking]),
      });
      const useCase = new CreateBookingUseCase(repository);
      await expect(useCase.execute(validInput)).rejects.toThrow('já está reservado');
    });

    it('allows booking adjacent to an existing one', async () => {
      const adjacentBooking: Booking = {
        ...fakeBooking, startTime: '09:00', durationHours: 1, // termina 10:00
      };
      const repository = makeRepository({
        create: jest.fn().mockResolvedValue(fakeBooking),
        findActiveByCourtAndDate: jest.fn().mockResolvedValue([adjacentBooking]),
      });
      const useCase = new CreateBookingUseCase(repository);
      await expect(useCase.execute(validInput)).resolves.toBeDefined();
    });
  });

  describe('minBookingLeadMinutes validation', () => {
    // "now" fixo: 2025-06-02 08:00 BRT (America/Sao_Paulo = UTC-3 → 11:00 UTC)
    const fixedNow = new Date('2025-06-02T11:00:00Z');

    it('does not throw when minBookingLeadMinutes is null', async () => {
      const repository = makeRepository({ create: jest.fn().mockResolvedValue(fakeBooking) });
      const useCase = new CreateBookingUseCase(repository);
      // startTime 10:00 same day — would be in the past, but no restriction
      await expect(
        useCase.execute({ ...validInput, minBookingLeadMinutes: null, now: fixedNow }),
      ).resolves.toBeDefined();
    });

    it('throws when slot start is within the lead window', async () => {
      const useCase = new CreateBookingUseCase(makeRepository());
      // now = 08:00 BRT, lead = 120 min → earliest = 10:00; slot 10:00 = NOT strictly after → should throw
      await expect(
        useCase.execute({
          ...validInput,
          date: '2025-06-02',
          startTime: '10:00',
          minBookingLeadMinutes: 120,
          now: fixedNow, // 08:00 BRT
        }),
      ).rejects.toThrow('antecedência mínima');
    });

    it('allows booking when slot start is after the lead window', async () => {
      const repository = makeRepository({ create: jest.fn().mockResolvedValue(fakeBooking) });
      const useCase = new CreateBookingUseCase(repository);
      // now = 08:00 BRT, lead = 120 min → earliest = 10:00; slot 11:00 → ok
      await expect(
        useCase.execute({
          ...validInput,
          date: '2025-06-02',
          startTime: '11:00',
          minBookingLeadMinutes: 120,
          now: fixedNow,
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('recurring block validation', () => {
    it('throws with recurring block reason when slot is blocked', async () => {
      const useCase = new CreateBookingUseCase(makeRepository());
      await expect(useCase.execute({
        ...validInput,
        startTime: '08:00',
        recurringBlocks: [{ dayOfWeek: 1, startTime: '07:00', endTime: '12:00', reason: 'Escola de vôlei' }],
      })).rejects.toThrow('Escola de vôlei');
    });

    it('throws without reason when recurring block has no reason', async () => {
      const useCase = new CreateBookingUseCase(makeRepository());
      await expect(useCase.execute({
        ...validInput,
        startTime: '08:00',
        recurringBlocks: [{ dayOfWeek: 1, startTime: '07:00', endTime: '12:00' }],
      })).rejects.toThrow('bloqueado das 07:00 às 12:00');
    });
  });
});
