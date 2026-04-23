export interface VenueImage {
  id: string;
  venueId: string;
  imageId: string;
  sortOrder: number;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
  originalName?: string;
  createdAt: Date;
}
