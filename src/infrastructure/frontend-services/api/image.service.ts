export interface ImageDTO {
  id: string;
  ownerId: string;
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string | null;
  createdAt: string;
}

export const imageService = {
  async list(): Promise<ImageDTO[]> {
    const res = await fetch('/api/images', { credentials: 'include' });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: null }));
      throw new Error((error as string | null) ?? 'Falha ao carregar galeria.');
    }
    const data = (await res.json()) as { images: ImageDTO[] };
    return data.images;
  },

  async register(input: {
    storageKey: string;
    publicUrl: string;
    mimeType: string;
    sizeBytes: number;
    originalName?: string;
  }): Promise<ImageDTO> {
    const res = await fetch('/api/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: null }));
      throw new Error((error as string | null) ?? 'Falha ao registrar imagem.');
    }
    const data = (await res.json()) as { image: ImageDTO };
    return data.image;
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/images/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: null }));
      throw new Error((error as string | null) ?? 'Falha ao excluir imagem.');
    }
  },
};
