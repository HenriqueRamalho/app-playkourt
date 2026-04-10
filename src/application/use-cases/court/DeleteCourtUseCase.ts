import { CourtRepositoryInterface } from '@/domain/court/repository/court-repository.interface';

export class DeleteCourtUseCase {
  constructor(private courtRepository: CourtRepositoryInterface) {}

  async execute(id: string): Promise<void> {
    return this.courtRepository.delete(id);
  }
}
