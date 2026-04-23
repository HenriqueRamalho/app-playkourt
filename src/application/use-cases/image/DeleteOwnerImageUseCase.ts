import type { ImageRepositoryInterface } from '@/domain/image/repository/image-repository.interface';

export class DeleteOwnerImageUseCase {
  constructor(private imageRepository: ImageRepositoryInterface) {}

  async execute(id: string, ownerId: string): Promise<boolean> {
    return this.imageRepository.deleteByIdAndOwnerId(id, ownerId);
  }
}
