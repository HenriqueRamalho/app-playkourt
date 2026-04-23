'use client';

import { useRef, useState } from 'react';
import { uploadService } from '@/infrastructure/frontend-services/api/upload.service';
import { imageService, type ImageDTO } from '@/infrastructure/frontend-services/api/image.service';

const ACCEPT = 'image/jpeg,image/png,image/webp';

type Props = {
  onUploaded: (image: ImageDTO) => void;
};

export function UploadImageButton({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          setError('Use apenas JPEG, PNG ou WebP.');
          continue;
        }
        const presign = await uploadService.presignImage({
          contentType: file.type,
          contentLength: file.size,
        });
        await uploadService.putToPresignedUrl(presign, file);
        const registered = await imageService.register({
          storageKey: presign.key,
          publicUrl: presign.publicUrl,
          mimeType: file.type,
          sizeBytes: file.size,
          originalName: file.name,
        });
        onUploaded(registered);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no envio.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
        disabled={uploading}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {uploading ? 'Enviando…' : 'Enviar imagens'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
