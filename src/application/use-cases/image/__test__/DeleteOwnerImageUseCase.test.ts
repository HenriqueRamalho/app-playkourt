import { DeleteOwnerImageUseCase } from '@/application/use-cases/image/DeleteOwnerImageUseCase';
import type { ImageRepositoryInterface } from '@/domain/image/repository/image-repository.interface';

const IMAGE_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const OWNER_ID = '11111111-2222-3333-4444-555555555555';

const makeRepository = (overrides?: Partial<ImageRepositoryInterface>): ImageRepositoryInterface => ({
  create: jest.fn(),
  listByOwnerId: jest.fn(),
  deleteByIdAndOwnerId: jest.fn(),
  findByIdAndOwnerId: jest.fn(),
  ...overrides,
});

describe('DeleteOwnerImageUseCase', () => {
  it('returns true when repository deletes a row', async () => {
    const repo = makeRepository({ deleteByIdAndOwnerId: jest.fn().mockResolvedValue(true) });
    const useCase = new DeleteOwnerImageUseCase(repo);

    await expect(useCase.execute(IMAGE_ID, OWNER_ID)).resolves.toBe(true);
    expect(repo.deleteByIdAndOwnerId).toHaveBeenCalledWith(IMAGE_ID, OWNER_ID);
  });

  it('returns false when no row matches id and owner', async () => {
    const repo = makeRepository({ deleteByIdAndOwnerId: jest.fn().mockResolvedValue(false) });
    const useCase = new DeleteOwnerImageUseCase(repo);

    await expect(useCase.execute(IMAGE_ID, OWNER_ID)).resolves.toBe(false);
    expect(repo.deleteByIdAndOwnerId).toHaveBeenCalledWith(IMAGE_ID, OWNER_ID);
  });
});
