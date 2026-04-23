'use client';

import { useState } from 'react';
import { imageService, type ImageDTO } from '@/infrastructure/frontend-services/api/image.service';
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

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

type Props = {
  images: ImageDTO[];
  onRemove: (id: string) => void;
};

export function ImageGrid({ images, onRemove }: Props) {
  const [pendingDelete, setPendingDelete] = useState<ImageDTO | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDialogError(null);
    setDeletingId(pendingDelete.id);
    try {
      await imageService.delete(pendingDelete.id);
      onRemove(pendingDelete.id);
      setPendingDelete(null);
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : 'Falha ao excluir.');
    } finally {
      setDeletingId(null);
    }
  }

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
        <p className="text-gray-500 text-sm">Nenhuma imagem ainda. Envie arquivos JPEG, PNG ou WebP.</p>
      </div>
    );
  }

  return (
    <div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((img) => (
          <li
            key={img.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
          >
            <div className="aspect-video bg-gray-100 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.publicUrl}
                alt={img.originalName || 'Imagem da galeria'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-3 flex-1 flex flex-col gap-1 text-sm">
              <p className="font-medium text-gray-900 truncate" title={img.originalName || undefined}>
                {img.originalName || 'Sem nome'}
              </p>
              <p className="text-xs text-gray-500">
                {formatBytes(img.sizeBytes)} · {formatDate(img.createdAt)}
              </p>
              <button
                type="button"
                disabled={deletingId === img.id}
                onClick={() => {
                  setDialogError(null);
                  setPendingDelete(img);
                }}
                className="mt-2 self-start text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                {deletingId === img.id ? 'Removendo…' : 'Remover da galeria'}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
            setDialogError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover da galeria?</AlertDialogTitle>
            <AlertDialogDescription>
              A imagem deixará de aparecer aqui. A associação com locais virá em outra etapa.
              {pendingDelete && (
                <>
                  {' '}
                  <span className="font-medium text-foreground">
                    {pendingDelete.originalName || 'Sem nome'}
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {dialogError && (
            <p className="text-sm text-red-600" role="alert">
              {dialogError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={deletingId !== null}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deletingId !== null}
              onClick={() => void confirmDelete()}
            >
              {deletingId !== null ? 'Removendo…' : 'Remover'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
