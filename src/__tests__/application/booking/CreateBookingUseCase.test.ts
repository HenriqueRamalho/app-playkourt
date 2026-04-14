import { CreateBookingUseCase } from '@/application/use-cases/booking/CreateBookingUseCase';
import { BookingRepositoryInterface } from '@/domain/booking/repository/booking-repository.interface';
import { Booking, BookingStatus } from '@/domain/booking/entity/booking.interface';

const makeRepository = (overrides?: Partial<BookingRepositoryInterface>): BookingRepositoryInterface => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findByCourtId: jest.fn(),
  findByVenueId: jest.fn(),
  updateStatus: jest.fn(),
  ...overrides,
});

const validInput = {
  courtId: 'court-1',
  userId: 'user-1',
  date: '2025-12-01',
  startTime: '10:00',
  durationHours: 1,
};

const fakeBooking: Booking = {
  id: 'booking-1',
  ...validInput,
  status: BookingStatus.PENDING,
  createdAt: new Date(),
};

describe('CreateBookingUseCase', () => {
  it('creates a booking with status pending', async () => {
    const repository = makeRepository({ create: jest.fn().mockResolvedValue(fakeBooking) });
    const useCase = new CreateBookingUseCase(repository);

    const result = await useCase.execute(validInput);

    expect(repository.create).toHaveBeenCalledWith({ ...validInput, status: BookingStatus.PENDING });
    expect(result.status).toBe(BookingStatus.PENDING);
  });

  it('throws if date is missing', async () => {
    const repository = makeRepository();
    const useCase = new CreateBookingUseCase(repository);

    await expect(useCase.execute({ ...validInput, date: '' })).rejects.toThrow('Date is required');
  });

  it('throws if startTime is missing', async () => {
    const repository = makeRepository();
    const useCase = new CreateBookingUseCase(repository);

    await expect(useCase.execute({ ...validInput, startTime: '' })).rejects.toThrow('Start time is required');
  });

  it('throws if durationHours is less than 1', async () => {
    const repository = makeRepository();
    const useCase = new CreateBookingUseCase(repository);

    await expect(useCase.execute({ ...validInput, durationHours: 0 })).rejects.toThrow('Duration must be between 1 and 4 hours');
  });

  it('throws if durationHours is greater than 4', async () => {
    const repository = makeRepository();
    const useCase = new CreateBookingUseCase(repository);

    await expect(useCase.execute({ ...validInput, durationHours: 5 })).rejects.toThrow('Duration must be between 1 and 4 hours');
  });
});
