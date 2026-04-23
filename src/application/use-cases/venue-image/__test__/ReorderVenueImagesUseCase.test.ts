import { ReorderVenueImagesError, ReorderVenueImagesUseCase } from '@/application/use-cases/venue-image/ReorderVenueImagesUseCase';
import type { VenueImage } from '@/domain/venue-image/entity/venue-image.interface';
import type { VenueImageRepositoryInterface } from '@/domain/venue-image/repository/venue-image-repository.interface';

const V1 = 'aaaaaaaa-bbbb-cccc-dddd-eeee11111111';
const V2 = 'aaaaaaaa-bbbb-cccc-dddd-eeee22222222';
const venueId = 'ven-0000-0000-0000-000000000001';
const t = new Date();

const makeVi = (imageId: string, sortOrder: number): VenueImage => ({
  id: `link-${imageId.slice(0, 8)}`,
  venueId,
  imageId,
  sortOrder,
  publicUrl: 'https://cdn.test/x',
  mimeType: 'image/jpeg',
  sizeBytes: 1,
  originalName: 'a.jpg',
  createdAt: t,
});

const makeRepo = (overrides: Partial<VenueImageRepositoryInterface> = {}): VenueImageRepositoryInterface => ({
  listByVenueId: jest.fn(),
  countByVenueId: jest.fn(),
  attach: jest.fn(),
  findLink: jest.fn(),
  detachByVenueAndImage: jest.fn(),
  reorder: jest.fn(),
  ...overrides,
});

describe('ReorderVenueImagesUseCase', () => {
  it('rejects empty array', async () => {
    const repo = makeRepo();
    const useCase = new ReorderVenueImagesUseCase(repo);
    await expect(useCase.execute(venueId, [])).rejects.toThrow(ReorderVenueImagesError);
    expect(repo.reorder).not.toHaveBeenCalled();
  });

  it('rejects duplicates in input', async () => {
    const repo = makeRepo();
    const useCase = new ReorderVenueImagesUseCase(repo);
    await expect(useCase.execute(venueId, [V1, V1])).rejects.toThrow(ReorderVenueImagesError);
    expect(repo.reorder).not.toHaveBeenCalled();
  });

  it('rejects when set does not match current venue images', async () => {
    const current = [makeVi(V1, 0), makeVi(V2, 1)];
    const repo = makeRepo({
      listByVenueId: jest.fn().mockResolvedValue(current),
    });
    const useCase = new ReorderVenueImagesUseCase(repo);
    await expect(useCase.execute(venueId, [V1])).rejects.toThrow(
      'A lista de imagens não confere com as fotos atuais do local.',
    );
    expect(repo.reorder).not.toHaveBeenCalled();
  });

  it('calls reorder when order is a permutation of current', async () => {
    const current = [makeVi(V1, 0), makeVi(V2, 1)];
    const repo = makeRepo({
      listByVenueId: jest.fn().mockResolvedValue(current),
    });
    const useCase = new ReorderVenueImagesUseCase(repo);
    await useCase.execute(venueId, [V2, V1]);
    expect(repo.reorder).toHaveBeenCalledWith(venueId, [V2, V1]);
  });
});
