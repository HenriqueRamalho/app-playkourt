import type { Image } from '@/domain/image/entity/image.interface';
import type { ImageRepositoryInterface } from '@/domain/image/repository/image-repository.interface';

export class ListOwnerImagesUseCase {
  constructor(private imageRepository: ImageRepositoryInterface) {}

  async execute(ownerId: string): Promise<Image[]> {
    return this.imageRepository.listByOwnerId(ownerId);
  }
}
