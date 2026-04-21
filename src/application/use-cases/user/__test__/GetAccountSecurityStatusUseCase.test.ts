import { GetAccountSecurityStatusUseCase } from '@/application/use-cases/user/GetAccountSecurityStatusUseCase';
import type { UserRepositoryInterface } from '@/domain/user/repository/user-repository.interface';

const USER_ID = '11111111-2222-3333-4444-555555555555';

const makeRepository = (overrides?: Partial<UserRepositoryInterface>): UserRepositoryInterface => ({
  findById: jest.fn(),
  updateName: jest.fn(),
  hasPasswordCredential: jest.fn().mockResolvedValue(false),
  ...overrides,
});

describe('GetAccountSecurityStatusUseCase', () => {
  it('returns hasPasswordCredential true when repository reports credential with password', async () => {
    const repo = makeRepository({
      hasPasswordCredential: jest.fn().mockResolvedValue(true),
    });
    const useCase = new GetAccountSecurityStatusUseCase(repo);

    await expect(useCase.execute(USER_ID)).resolves.toEqual({ hasPasswordCredential: true });
    expect(repo.hasPasswordCredential).toHaveBeenCalledWith(USER_ID);
  });

  it('returns hasPasswordCredential false when repository reports no local password', async () => {
    const repo = makeRepository({
      hasPasswordCredential: jest.fn().mockResolvedValue(false),
    });
    const useCase = new GetAccountSecurityStatusUseCase(repo);

    await expect(useCase.execute(USER_ID)).resolves.toEqual({ hasPasswordCredential: false });
    expect(repo.hasPasswordCredential).toHaveBeenCalledWith(USER_ID);
  });
});
