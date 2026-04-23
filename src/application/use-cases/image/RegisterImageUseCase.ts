import type { CreateImageInput, Image } from '@/domain/image/entity/image.interface';
import type { ImageRepositoryInterface } from '@/domain/image/repository/image-repository.interface';

export class RegisterImageUseCase {
  constructor(private imageRepository: ImageRepositoryInterface) {}

  async execute(input: CreateImageInput): Promise<Image> {
    return this.imageRepository.create(input);
  }
}
