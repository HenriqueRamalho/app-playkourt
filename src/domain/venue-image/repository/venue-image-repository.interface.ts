import type { VenueImage } from '@/domain/venue-image/entity/venue-image.interface';

export interface VenueImageRepositoryInterface {
  listByVenueId(venueId: string): Promise<VenueImage[]>;
  countByVenueId(venueId: string): Promise<number>;
  attach(venueId: string, imageId: string, sortOrder: number): Promise<VenueImage>;
  findLink(venueId: string, imageId: string): Promise<VenueImage | null>;
  detachByVenueAndImage(venueId: string, imageId: string): Promise<boolean>;
  reorder(venueId: string, orderedImageIds: string[]): Promise<void>;
}
