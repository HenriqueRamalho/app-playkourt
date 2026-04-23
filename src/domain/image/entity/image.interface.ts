export interface Image {
  id: string;
  ownerId: string;
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
  originalName?: string;
  createdAt: Date;
}

export interface CreateImageInput {
  ownerId: string;
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
  originalName?: string;
}
