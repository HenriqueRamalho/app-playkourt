'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { imageService, type ImageDTO } from '@/infrastructure/frontend-services/api/image.service';
import { ImageGrid } from './_components/ImageGrid';
import { UploadImageButton } from './_components/UploadImageButton';

export default function AdminGalleryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [images, setImages] = useState<ImageDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    imageService
      .list()
      .then(setImages)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar galeria'))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleUploaded = useCallback((img: ImageDTO) => {
    setImages((prev) => [img, ...prev]);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
  }, []);

  if (authLoading || loading) {
    return (
      <div className="text-sm text-gray-500">Carregando galeria…</div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Galeria de imagens</h1>
          <p className="mt-1 text-sm text-gray-500 max-w-xl">
            Envie imagens para reutilizar depois em locais e quadras. Por enquanto elas ficam só na sua
            galeria.
          </p>
        </div>
        <UploadImageButton onUploaded={handleUploaded} />
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <ImageGrid images={images} onRemove={handleRemove} />
    </div>
  );
}
