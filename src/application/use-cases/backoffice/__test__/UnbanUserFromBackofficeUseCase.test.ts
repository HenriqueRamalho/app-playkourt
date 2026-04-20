import {
  UnbanTargetNotFoundError,
  UnbanUserFromBackofficeUseCase,
} from '@/application/use-cases/backoffice/UnbanUserFromBackofficeUseCase';
import { BanSource } from '@/domain/user/entity/ban-source';
import {
  BackofficeUserBanState,
  BackofficeUserBanTarget,
  BackofficeUserRepositoryInterface,
} from '@/domain/user/repository/backoffice-user-repository.interface';

const TARGET_ID = 'db9da19f-b30e-4083-a8a1-edeefc72f9df';
const ACTOR_ID = '11111111-2222-3333-4444-555555555555';

const makeTarget = (overrides: Partial<BackofficeUserBanTarget> = {}): BackofficeUserBanTarget => ({
  id: TARGET_ID,
  email: 'user@example.com',
  banned: true,
  banReason: 'motivo antigo',
  banSource: BanSource.STAFF,
  bannedAt: new Date('2026-04-18T10:00:00Z'),
  ...overrides,
});

const makeUnbannedState = (): BackofficeUserBanState => ({
  id: TARGET_ID,
  banned: false,
  banReason: null,
  banSource: null,
  bannedAt: null,
});

const makeRepository = (
  overrides?: Partial<BackofficeUserRepositoryInterface>,
): BackofficeUserRepositoryInterface => ({
  list: jest.fn(),
  findOverviewById: jest.fn(),
  listVenues: jest.fn(),
  listBookings: jest.fn(),
  listActiveSessions: jest.fn(),
  findBanTargetById: jest.fn().mockResolvedValue(makeTarget()),
  banUser: jest.fn(),
  unbanUser: jest.fn().mockResolvedValue(makeUnbannedState()),
  deleteSessionsOfUser: jest.fn(),
  ...overrides,
});

const validInput = { userId: TARGET_ID, actorId: ACTOR_ID };

describe('UnbanUserFromBackofficeUseCase', () => {
  describe('input validation', () => {
    it('throws if userId is not a valid UUID', async () => {
      const useCase = new UnbanUserFromBackofficeUseCase(makeRepository());
      await expect(useCase.execute({ ...validInput, userId: 'nope' })).rejects.toThrow(
        'Invalid id',
      );
    });

    it('throws if actorId is not a valid UUID', async () => {
      const useCase = new UnbanUserFromBackofficeUseCase(makeRepository());
      await expect(useCase.execute({ ...validInput, actorId: 'nope' })).rejects.toThrow(
        'Invalid actorId',
      );
    });
  });

  describe('authorization', () => {
    it('throws UnbanTargetNotFoundError when target does not exist', async () => {
      const repository = makeRepository({
        findBanTargetById: jest.fn().mockResolvedValue(null),
      });
      const useCase = new UnbanUserFromBackofficeUseCase(repository);

      await expect(useCase.execute(validInput)).rejects.toBeInstanceOf(UnbanTargetNotFoundError);
    });
  });

  describe('success flow', () => {
    it('unbans a currently banned user', async () => {
      const unbanUser = jest.fn().mockResolvedValue(makeUnbannedState());
      const repository = makeRepository({ unbanUser });
      const useCase = new UnbanUserFromBackofficeUseCase(repository);

      const result = await useCase.execute(validInput);

      expect(unbanUser).toHaveBeenCalledWith(TARGET_ID);
      expect(result).toEqual({
        id: TARGET_ID,
        banned: false,
        banReason: null,
        banSource: null,
        bannedAt: null,
      });
    });
  });

  describe('idempotency', () => {
    it('does not call unbanUser when target is already unbanned', async () => {
      const unbanUser = jest.fn();
      const repository = makeRepository({
        findBanTargetById: jest.fn().mockResolvedValue(
          makeTarget({ banned: false, banReason: null, banSource: null, bannedAt: null }),
        ),
        unbanUser,
      });
      const useCase = new UnbanUserFromBackofficeUseCase(repository);

      const result = await useCase.execute(validInput);

      expect(unbanUser).not.toHaveBeenCalled();
      expect(result).toEqual({
        id: TARGET_ID,
        banned: false,
        banReason: null,
        banSource: null,
        bannedAt: null,
      });
    });
  });
});
