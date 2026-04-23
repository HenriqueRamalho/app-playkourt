import type { CreateImageInput, Image } from '@/domain/image/entity/image.interface';

export interface ImageRepositoryInterface {
  create(input: CreateImageInput): Promise<Image>;
  listByOwnerId(ownerId: string): Promise<Image[]>;
  deleteByIdAndOwnerId(id: string, ownerId: string): Promise<boolean>;
}
