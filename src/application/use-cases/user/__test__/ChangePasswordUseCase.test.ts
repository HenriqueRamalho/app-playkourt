import { ChangePasswordUseCase } from '@/application/use-cases/user/ChangePasswordUseCase';
import type { UserPasswordServiceInterface } from '@/domain/user/ports/user-password-service.interface';
import type { UserRepositoryInterface } from '@/domain/user/repository/user-repository.interface';

const USER_ID = '11111111-2222-3333-4444-555555555555';
const HEADERS = new Headers({ 'x-test': '1' });

const validInput = {
  currentPassword: 'OldPass12!',
  newPassword: 'NewPass12!',
  confirmNewPassword: 'NewPass12!',
  revokeOtherSessions: true,
};

const makeRepository = (overrides?: Partial<UserRepositoryInterface>): UserRepositoryInterface => ({
  findById: jest.fn(),
  updateName: jest.fn(),
  hasPasswordCredential: jest.fn().mockResolvedValue(true),
  ...overrides,
});

const makePasswordService = (overrides?: Partial<UserPasswordServiceInterface>): UserPasswordServiceInterface => ({
  changePassword: jest.fn().mockResolvedValue({ responseHeaders: new Headers() }),
  setInitialPassword: jest.fn(),
  ...overrides,
});

describe('ChangePasswordUseCase', () => {
  it('throws when user has no local password credential', async () => {
    const repo = makeRepository({ hasPasswordCredential: jest.fn().mockResolvedValue(false) });
    const passwordService = makePasswordService();
    const useCase = new ChangePasswordUseCase(repo, passwordService);

    await expect(useCase.execute(USER_ID, validInput, HEADERS)).rejects.toThrow(
      'Esta conta não possui senha local. Use a opção para definir uma senha.',
    );
    expect(passwordService.changePassword).not.toHaveBeenCalled();
  });

  it('throws when current password is empty', async () => {
    const useCase = new ChangePasswordUseCase(makeRepository(), makePasswordService());

    await expect(
      useCase.execute(
        USER_ID,
        { ...validInput, currentPassword: '', newPassword: 'abcdefgh', confirmNewPassword: 'abcdefgh' },
        HEADERS,
      ),
    ).rejects.toThrow('Informe a senha atual.');
  });

  it('throws when current password is only whitespace', async () => {
    const useCase = new ChangePasswordUseCase(makeRepository(), makePasswordService());

    await expect(
      useCase.execute(
        USER_ID,
        { ...validInput, currentPassword: '   ', newPassword: 'abcdefgh', confirmNewPassword: 'abcdefgh' },
        HEADERS,
      ),
    ).rejects.toThrow('Informe a senha atual.');
  });

  it('throws when new password is shorter than 8 characters', async () => {
    const useCase = new ChangePasswordUseCase(makeRepository(), makePasswordService());

    await expect(
      useCase.execute(
        USER_ID,
        { ...validInput, newPassword: 'short1', confirmNewPassword: 'short1' },
        HEADERS,
      ),
    ).rejects.toThrow('A nova senha deve ter pelo menos 8 caracteres.');
  });

  it('throws when confirmation does not match new password', async () => {
    const useCase = new ChangePasswordUseCase(makeRepository(), makePasswordService());

    await expect(
      useCase.execute(
        USER_ID,
        { ...validInput, newPassword: 'abcdefgh', confirmNewPassword: 'abcdefgH' },
        HEADERS,
      ),
    ).rejects.toThrow('A confirmação da nova senha não confere.');
  });

  it('throws when new password equals current password', async () => {
    const useCase = new ChangePasswordUseCase(makeRepository(), makePasswordService());

    await expect(
      useCase.execute(
        USER_ID,
        {
          ...validInput,
          currentPassword: 'SamePass1!',
          newPassword: 'SamePass1!',
          confirmNewPassword: 'SamePass1!',
        },
        HEADERS,
      ),
    ).rejects.toThrow('A nova senha deve ser diferente da senha atual.');
  });

  it('delegates to password service with input and request headers on success', async () => {
    const repo = makeRepository();
    const passwordService = makePasswordService();
    const useCase = new ChangePasswordUseCase(repo, passwordService);

    const result = await useCase.execute(
      USER_ID,
      {
        currentPassword: 'a',
        newPassword: 'bbbbbbbb',
        confirmNewPassword: 'bbbbbbbb',
        revokeOtherSessions: false,
      },
      HEADERS,
    );

    expect(result).toEqual({ responseHeaders: expect.any(Headers) });
    expect(passwordService.changePassword).toHaveBeenCalledTimes(1);
    expect(passwordService.changePassword).toHaveBeenCalledWith(
      {
        currentPassword: 'a',
        newPassword: 'bbbbbbbb',
        revokeOtherSessions: false,
      },
      HEADERS,
    );
  });
});
