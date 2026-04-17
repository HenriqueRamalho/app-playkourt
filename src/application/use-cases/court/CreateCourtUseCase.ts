import { CourtRepositoryInterface } from '@/domain/court/repository/court-repository.interface';
import { Court, SportType } from '@/domain/court/entity/court.interface';

export interface CreateCourtInput {
  venueId: string;
  name: string;
  sportType: SportType;
  description?: string;
  pricePerHour: number;
}

export class CreateCourtUseCase {
  constructor(private courtRepository: CourtRepositoryInterface) {}

  async execute(input: CreateCourtInput): Promise<Court> {
    return this.courtRepository.create({ ...input, isActive: true, useVenueHours: true });
  }
}
