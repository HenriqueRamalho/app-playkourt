export interface VenueImageDTO {
  id: string;
  venueId: string;
  imageId: string;
  sortOrder: number;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string | null;
  createdAt: string;
}

export const venueImageService = {
  async list(venueId: string): Promise<VenueImageDTO[]> {
    const res = await fetch(`/api/venues/${venueId}/images`, { credentials: 'include' });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: null }));
      throw new Error((error as string | null) ?? 'Falha ao carregar fotos.');
    }
    const data = (await res.json()) as { images: VenueImageDTO[] };
    return data.images;
  },

  async attach(venueId: string, imageId: string): Promise<VenueImageDTO> {
    const res = await fetch(`/api/venues/${venueId}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ imageId }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: null }));
      throw new Error((error as string | null) ?? 'Falha ao adicionar foto.');
    }
    const data = (await res.json()) as { image: VenueImageDTO };
    return data.image;
  },

  async detach(venueId: string, imageId: string): Promise<void> {
    const res = await fetch(`/api/venues/${venueId}/images/${imageId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: null }));
      throw new Error((error as string | null) ?? 'Falha ao remover foto.');
    }
  },

  async reorder(venueId: string, imageIds: string[]): Promise<void> {
    const res = await fetch(`/api/venues/${venueId}/images/order`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ imageIds }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: null }));
      throw new Error((error as string | null) ?? 'Falha ao reordenar fotos.');
    }
  },
};
