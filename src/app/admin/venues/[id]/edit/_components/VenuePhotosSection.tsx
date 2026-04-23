'use client';

import { useRef, useState } from 'react';
import { uploadService } from '@/infrastructure/frontend-services/api/upload.service';
import { imageService } from '@/infrastructure/frontend-services/api/image.service';
import {
  venueImageService,
  type VenueImageDTO,
} from '@/infrastructure/frontend-services/api/venue-image.service';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MAX_VENUE_IMAGES } from '@/application/use-cases/venue-image/AttachImageToVenueUseCase';

const ACCEPT = 'image/jpeg,image/png,image/webp';

function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
  venueId: string;
  initialPhotos: VenueImageDTO[];
};

export function VenuePhotosSection({ venueId, initialPhotos }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<VenueImageDTO[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingDetach, setPendingDetach] = useState<VenueImageDTO | null>(null);
  const [detachingId, setDetachingId] = useState<string | null>(null);
  const [detachError, setDetachError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);

  const remaining = MAX_VENUE_IMAGES - photos.length;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (photos.length >= MAX_VENUE_IMAGES) {
          setUploadError(`Limite de ${MAX_VENUE_IMAGES} fotos atingido.`);
          break;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          setUploadError('Use apenas JPEG, PNG ou WebP.');
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
        const venueImage = await venueImageService.attach(venueId, registered.id);
        setPhotos((prev) => [...prev, venueImage]);
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Falha no envio.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function applyLocalOrder(next: VenueImageDTO[]) {
    setPhotos(next.map((p, i) => ({ ...p, sortOrder: i })));
  }

  async function moveUp(index: number) {
    if (reordering || index <= 0) return;
    setReorderError(null);
    const prev = photos;
    const next = [...photos];
    [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
    const imageIds = next.map((p) => p.imageId);
    setReordering(true);
    try {
      await venueImageService.reorder(venueId, imageIds);
      applyLocalOrder(next);
    } catch (e) {
      setPhotos(prev);
      setReorderError(e instanceof Error ? e.message : 'Falha ao reordenar.');
    } finally {
      setReordering(false);
    }
  }

  async function moveDown(index: number) {
    if (reordering || index >= photos.length - 1) return;
    setReorderError(null);
    const prev = photos;
    const next = [...photos];
    [next[index], next[index + 1]] = [next[index + 1]!, next[index]!];
    const imageIds = next.map((p) => p.imageId);
    setReordering(true);
    try {
      await venueImageService.reorder(venueId, imageIds);
      applyLocalOrder(next);
    } catch (e) {
      setPhotos(prev);
      setReorderError(e instanceof Error ? e.message : 'Falha ao reordenar.');
    } finally {
      setReordering(false);
    }
  }

  async function confirmDetach() {
    if (!pendingDetach) return;
    setDetachError(null);
    setDetachingId(pendingDetach.imageId);
    try {
      await venueImageService.detach(venueId, pendingDetach.imageId);
      setPhotos((prev) => prev.filter((p) => p.id !== pendingDetach.id));
      setPendingDetach(null);
    } catch (e) {
      setDetachError(e instanceof Error ? e.message : 'Falha ao remover.');
    } finally {
      setDetachingId(null);
    }
  }

  return (
    <section>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Fotos do estabelecimento
          </h2>
          <p className="mt-1 text-xs text-gray-500 max-w-md">
            Adicione até {MAX_VENUE_IMAGES} fotos do local — quadras, recepção, estacionamento.
            Prefira imagens com boa iluminação e resolução mínima de 1280×720. A primeira foto é a
            capa; use Subir e Descer para alterar a ordem.
            {remaining > 0 && ` Você pode adicionar mais ${remaining}.`}
          </p>
        </div>
        <div className="shrink-0">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
            disabled={uploading || photos.length >= MAX_VENUE_IMAGES}
          />
          <button
            type="button"
            disabled={uploading || photos.length >= MAX_VENUE_IMAGES}
            onClick={() => inputRef.current?.click()}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Enviando…' : 'Adicionar fotos'}
          </button>
        </div>
      </div>

      {uploadError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {uploadError}
        </p>
      )}
      {reorderError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {reorderError}
        </p>
      )}

      {photos.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 p-10 text-center">
          <p className="text-sm text-gray-400">
            Nenhuma foto adicionada ainda. Clique em{' '}
            <span className="font-medium text-gray-500">Adicionar fotos</span> para começar.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo, idx) => (
            <li
              key={photo.id}
              className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-video"
            >
              {idx === 0 && (
                <span className="absolute top-1.5 left-1.5 z-10 bg-green-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  Capa
                </span>
              )}
              <div className="absolute top-1.5 right-1.5 z-10 flex flex-col gap-0.5">
                <button
                  type="button"
                  disabled={reordering || idx === 0}
                  onClick={() => void moveUp(idx)}
                  className="bg-white/90 text-gray-800 text-[10px] font-medium px-1.5 py-0.5 rounded shadow border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Mover para cima"
                >
                  Subir
                </button>
                <button
                  type="button"
                  disabled={reordering || idx === photos.length - 1}
                  onClick={() => void moveDown(idx)}
                  className="bg-white/90 text-gray-800 text-[10px] font-medium px-1.5 py-0.5 rounded shadow border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Mover para baixo"
                >
                  Descer
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.publicUrl}
                alt={photo.originalName || 'Foto do local'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-end p-2 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  disabled={detachingId === photo.imageId}
                  onClick={() => {
                    setDetachError(null);
                    setPendingDetach(photo);
                  }}
                  className="bg-white text-red-600 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  Remover
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1 text-white text-[10px] truncate">
                {photo.originalName || formatBytes(photo.sizeBytes)}
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog
        open={pendingDetach !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDetach(null);
            setDetachError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover foto?</AlertDialogTitle>
            <AlertDialogDescription>
              A foto será removida do estabelecimento. O arquivo continuará disponível na sua galeria
              pessoal.
              {pendingDetach?.originalName && (
                <>
                  {' '}
                  <span className="font-medium text-foreground">
                    {pendingDetach.originalName}
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {detachError && (
            <p className="text-sm text-red-600" role="alert">
              {detachError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={detachingId !== null}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={detachingId !== null}
              onClick={() => void confirmDetach()}
            >
              {detachingId !== null ? 'Removendo…' : 'Remover'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
