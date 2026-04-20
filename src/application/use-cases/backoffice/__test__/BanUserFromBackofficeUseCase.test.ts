import {
  BanUserFromBackofficeUseCase,
  CannotBanSelfError,
  CannotBanStaffError,
  TargetUserNotFoundError,
} from '@/application/use-cases/backoffice/BanUserFromBackofficeUseCase';
import { BanSource } from '@/domain/user/entity/ban-source';
import {
  BackofficeUserBanState,
  BackofficeUserBanTarget,
  BackofficeUserRepositoryInterface,
} from '@/domain/user/repository/backoffice-user-repository.interface';

const TARGET_ID = 'db9da19f-b30e-4083-a8a1-edeefc72f9df';
const ACTOR_ID = '11111111-2222-3333-4444-555555555555';
const STAFF_EMAIL = 'hrd.ramalho@gmail.com';
const REGULAR_EMAIL = 'user@example.com';

const validReason = 'Violação recorrente dos termos de uso.';

const makeTarget = (overrides: Partial<BackofficeUserBanTarget> = {}): BackofficeUserBanTarget => ({
  id: TARGET_ID,
  email: REGULAR_EMAIL,
  banned: false,
  banReason: null,
  banSource: null,
  bannedAt: null,
  ...overrides,
});

const makeBanState = (overrides: Partial<BackofficeUserBanState> = {}): BackofficeUserBanState => ({
  id: TARGET_ID,
  banned: true,
  banReason: validReason,
  banSource: BanSource.STAFF,
  bannedAt: new Date('2026-04-19T10:00:00Z'),
  ...overrides,
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
  banUser: jest.fn().mockResolvedValue(makeBanState()),
  unbanUser: jest.fn(),
  deleteSessionsOfUser: jest.fn().mockResolvedValue(0),
  ...overrides,
});

const isStaffEmail = (email: string) => email === STAFF_EMAIL;

const validInput = {
  userId: TARGET_ID,
  actorId: ACTOR_ID,
  reason: validReason,
};

describe('BanUserFromBackofficeUseCase', () => {
  describe('input validation', () => {
    it('throws if userId is not a valid UUID', async () => {
      const useCase = new BanUserFromBackofficeUseCase(makeRepository(), isStaffEmail);
      await expect(useCase.execute({ ...validInput, userId: 'not-a-uuid' })).rejects.toThrow(
        'Invalid id',
      );
    });

    it('throws if userId is empty', async () => {
      const useCase = new BanUserFromBackofficeUseCase(makeRepository(), isStaffEmail);
      await expect(useCase.execute({ ...validInput, userId: '' })).rejects.toThrow('Invalid id');
    });

    it('throws if actorId is not a valid UUID', async () => {
      const useCase = new BanUserFromBackofficeUseCase(makeRepository(), isStaffEmail);
      await expect(useCase.execute({ ...validInput, actorId: 'nope' })).rejects.toThrow(
        'Invalid actorId',
      );
    });

    it('throws if reason is shorter than 10 characters', async () => {
      const useCase = new BanUserFromBackofficeUseCase(makeRepository(), isStaffEmail);
      await expect(useCase.execute({ ...validInput, reason: 'curto' })).rejects.toThrow(
        'Invalid reason',
      );
    });

    it('throws if reason is only whitespace', async () => {
      const useCase = new BanUserFromBackofficeUseCase(makeRepository(), isStaffEmail);
      await expect(
        useCase.execute({ ...validInput, reason: '              ' }),
      ).rejects.toThrow('Invalid reason');
    });

    it('throws if reason is longer than 500 characters', async () => {
      const useCase = new BanUserFromBackofficeUseCase(makeRepository(), isStaffEmail);
      await expect(useCase.execute({ ...validInput, reason: 'a'.repeat(501) })).rejects.toThrow(
        'Invalid reason',
      );
    });

    it('accepts reason at boundaries (10 and 500 characters after trim)', async () => {
      const repository = makeRepository();
      const useCase = new BanUserFromBackofficeUseCase(repository, isStaffEmail);

      await expect(useCase.execute({ ...validInput, reason: 'a'.repeat(10) })).resolves.toBeDefined();
      await expect(useCase.execute({ ...validInput, reason: 'a'.repeat(500) })).resolves.toBeDefined();
    });

    it('trims reason before passing to repository', async () => {
      const banUser = jest.fn().mockResolvedValue(makeBanState());
      const repository = makeRepository({ banUser });
      const useCase = new BanUserFromBackofficeUseCase(repository, isStaffEmail);

      await useCase.execute({ ...validInput, reason: `   ${validReason}   ` });

      expect(banUser).toHaveBeenCalledWith(
        TARGET_ID,
        expect.objectContaining({ reason: validReason }),
      );
    });
  });

  describe('authorization', () => {
    it('throws CannotBanSelfError when actor bans themselves', async () => {
      const useCase = new BanUserFromBackofficeUseCase(makeRepository(), isStaffEmail);
      await expect(
        useCase.execute({ ...validInput, userId: ACTOR_ID, actorId: ACTOR_ID }),
      ).rejects.toBeInstanceOf(CannotBanSelfError);
    });

    it('throws TargetUserNotFoundError when repository returns null', async () => {
      const repository = makeRepository({ findBanTargetById: jest.fn().mockResolvedValue(null) });
      const useCase = new BanUserFromBackofficeUseCase(repository, isStaffEmail);

      await expect(useCase.execute(validInput)).rejects.toBeInstanceOf(TargetUserNotFoundError);
    });

    it('throws CannotBanStaffError when the target is on the staff allowlist', async () => {
      const repository = makeRepository({
        findBanTargetById: jest.fn().mockResolvedValue(makeTarget({ email: STAFF_EMAIL })),
      });
      const useCase = new BanUserFromBackofficeUseCase(repository, isStaffEmail);

      await expect(useCase.execute(validInput)).rejects.toBeInstanceOf(CannotBanStaffError);
    });

    it('does not call banUser when authorization fails', async () => {
      const banUser = jest.fn();
      const repository = makeRepository({
        findBanTargetById: jest.fn().mockResolvedValue(makeTarget({ email: STAFF_EMAIL })),
        banUser,
      });
      const useCase = new BanUserFromBackofficeUseCase(repository, isStaffEmail);

      await expect(useCase.execute(validInput)).rejects.toBeInstanceOf(CannotBanStaffError);
      expect(banUser).not.toHaveBeenCalled();
    });
  });

  describe('success flow', () => {
    it('persists ban with BanSource.STAFF', async () => {
      const banUser = jest.fn().mockResolvedValue(makeBanState());
      const repository = makeRepository({ banUser });
      const useCase = new BanUserFromBackofficeUseCase(repository, isStaffEmail);

      await useCase.execute(validInput);

      expect(banUser).toHaveBeenCalledWith(TARGET_ID, {
        reason: validReason,
        source: BanSource.STAFF,
      });
    });

    it('deletes user sessions after banning', async () => {
      const deleteSessionsOfUser = jest.fn().mockResolvedValue(3);
      const repository = makeRepository({ deleteSessionsOfUser });
      const useCase = new BanUserFromBackofficeUseCase(repository, isStaffEmail);

      const result = await useCase.execute(validInput);

      expect(deleteSessionsOfUser).toHaveBeenCalledWith(TARGET_ID);
      expect(result.revokedSessions).toBe(3);
    });

    it('returns the ban state from the repository', async () => {
      const bannedAt = new Date('2026-04-19T10:00:00Z');
      const repository = makeRepository({
        banUser: jest.fn().mockResolvedValue(
          makeBanState({ banReason: validReason, banSource: BanSource.STAFF, bannedAt }),
        ),
      });
      const useCase = new BanUserFromBackofficeUseCase(repository, isStaffEmail);

      const result = await useCase.execute(validInput);

      expect(result).toEqual({
        id: TARGET_ID,
        banned: true,
        banReason: validReason,
        banSource: BanSource.STAFF,
        bannedAt,
        revokedSessions: 0,
      });
    });

    it('is idempotent: banning an already-banned user updates the reason', async () => {
      const banUser = jest.fn().mockResolvedValue(makeBanState({ banReason: 'novo motivo atualizado' }));
      const repository = makeRepository({
        findBanTargetById: jest.fn().mockResolvedValue(
          makeTarget({ banned: true, banReason: 'motivo antigo', banSource: BanSource.STAFF }),
        ),
        banUser,
      });
      const useCase = new BanUserFromBackofficeUseCase(repository, isStaffEmail);

      const result = await useCase.execute({ ...validInput, reason: 'novo motivo atualizado' });

      expect(banUser).toHaveBeenCalledWith(TARGET_ID, {
        reason: 'novo motivo atualizado',
        source: BanSource.STAFF,
      });
      expect(result.banReason).toBe('novo motivo atualizado');
    });
  });
});
