import { Venue } from '../entity/venue.interface';
import { VenueMember, VenueMemberRole } from '../entity/venue-member.interface';

export interface VenueRepositoryInterface {
  create(venue: Omit<Venue, 'id' | 'createdAt'>): Promise<Venue>;
  findById(id: string): Promise<Venue | null>;
  findByOwnerId(ownerId: string): Promise<Venue[]>;
  addMember(venueId: string, userId: string, role: VenueMemberRole): Promise<VenueMember>;
}
