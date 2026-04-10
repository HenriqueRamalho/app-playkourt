import { CourtRepositoryInterface } from '@/domain/court/repository/court-repository.interface';
import { Court, SportType } from '@/domain/court/entity/court.interface';

export interface UpdateCourtInput {
  name?: string;
  sportType?: SportType;
  description?: string;
  pricePerHour?: number;
  isActive?: boolean;
}

export class UpdateCourtUseCase {
  constructor(private courtRepository: CourtRepositoryInterface) {}

  async execute(id: string, input: UpdateCourtInput): Promise<Court> {
    return this.courtRepository.update(id, input);
  }
}
