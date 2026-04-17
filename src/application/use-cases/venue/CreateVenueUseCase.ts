import { VenueRepositoryInterface } from '@/domain/venue/repository/venue-repository.interface';
import { Venue } from '@/domain/venue/entity/venue.interface';
import { VenueMemberRole } from '@/domain/venue/entity/venue-member.interface';

export interface CreateVenueInput {
  ownerId: string;
  name: string;
  cnpj?: string;
  phone?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  cityId: number;
  stateId: number;
  zipCode?: string;
  businessHours?: import('@/domain/venue/entity/venue.interface').BusinessHours[];
}

export class CreateVenueUseCase {
  constructor(private venueRepository: VenueRepositoryInterface) {}

  async execute(input: CreateVenueInput): Promise<Venue> {
    const venue = await this.venueRepository.create({
      ...input,
      isActive: true,
      businessHours: input.businessHours ?? [],
    });

    await this.venueRepository.addMember(venue.id, input.ownerId, VenueMemberRole.OWNER);

    return venue;
  }
}
