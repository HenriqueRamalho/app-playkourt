import { SetInitialPasswordUseCase } from '@/application/use-cases/user/SetInitialPasswordUseCase';
import type { UserPasswordServiceInterface } from '@/domain/user/ports/user-password-service.interface';
import type { UserRepositoryInterface } from '@/domain/user/repository/user-repository.interface';

const USER_ID = '22222222-3333-4444-5555-666666666666';
const HEADERS = new Headers();

const makeRepository = (overrides?: Partial<UserRepositoryInterface>): UserRepositoryInterface => ({
  findById: jest.fn(),
  updateName: jest.fn(),
  hasPasswordCredential: jest.fn().mockResolvedValue(false),
  ...overrides,
});

const makePasswordService = (overrides?: Partial<UserPasswordServiceInterface>): UserPasswordServiceInterface => ({
  changePassword: jest.fn(),
  setInitialPassword: jest.fn().mockResolvedValue({ responseHeaders: null }),
  ...overrides,
});

describe('SetInitialPasswordUseCase', () => {
  it('throws when user already has a local password', async () => {
    const repo = makeRepository({ hasPasswordCredential: jest.fn().mockResolvedValue(true) });
    const passwordService = makePasswordService();
    const useCase = new SetInitialPasswordUseCase(repo, passwordService);

    await expect(
      useCase.execute(
        USER_ID,
        { newPassword: 'abcdefgh', confirmNewPassword: 'abcdefgh' },
        HEADERS,
      ),
    ).rejects.toThrow('Você já possui uma senha. Use a opção de alterar senha.');
    expect(passwordService.setInitialPassword).not.toHaveBeenCalled();
  });

  it('throws when new password is shorter than 8 characters', async () => {
    const useCase = new SetInitialPasswordUseCase(makeRepository(), makePasswordService());

    await expect(
      useCase.execute(USER_ID, { newPassword: 'short1', confirmNewPassword: 'short1' }, HEADERS),
    ).rejects.toThrow('A senha deve ter pelo menos 8 caracteres.');
  });

  it('throws when confirmation does not match', async () => {
    const useCase = new SetInitialPasswordUseCase(makeRepository(), makePasswordService());

    await expect(
      useCase.execute(
        USER_ID,
        { newPassword: 'abcdefgh', confirmNewPassword: 'abcdefgH' },
        HEADERS,
      ),
    ).rejects.toThrow('A confirmação da senha não confere.');
  });

  it('delegates to password service with new password and headers on success', async () => {
    const repo = makeRepository();
    const passwordService = makePasswordService();
    const useCase = new SetInitialPasswordUseCase(repo, passwordService);

    const result = await useCase.execute(
      USER_ID,
      { newPassword: 'firstpass8', confirmNewPassword: 'firstpass8' },
      HEADERS,
    );

    expect(result).toEqual({ responseHeaders: null });
    expect(passwordService.setInitialPassword).toHaveBeenCalledTimes(1);
    expect(passwordService.setInitialPassword).toHaveBeenCalledWith({ newPassword: 'firstpass8' }, HEADERS);
  });
});
