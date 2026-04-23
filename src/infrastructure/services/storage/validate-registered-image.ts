import { resolveS3UploadConfig } from '@/infrastructure/services/storage/storage-env';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export class ImageUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageUploadValidationError';
  }
}

function safeUserSegment(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9-]/g, '') || 'user';
}

/**
 * Garante que o registro corresponde a um upload feito com presign do mesmo usuário
 * (prefixo, segmento de user e URL pública alinhada ao CloudFront).
 */
export function assertValidImageRegistration(input: {
  userId: string;
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
}): void {
  const config = resolveS3UploadConfig();
  if (!config) {
    throw new ImageUploadValidationError('Armazenamento S3 não configurado.');
  }

  const mime = input.mimeType.trim().toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    throw new ImageUploadValidationError('Tipo de imagem não permitido.');
  }

  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes < 1 || input.sizeBytes > config.maxBytes) {
    throw new ImageUploadValidationError('Tamanho de arquivo inválido.');
  }

  const expectedUrl = `${config.cdnBaseUrl}/${input.storageKey}`;
  if (input.publicUrl !== expectedUrl) {
    throw new ImageUploadValidationError('URL pública não confere com a chave de armazenamento.');
  }

  const prefix = `${config.keyPrefix}/`;
  if (!input.storageKey.startsWith(prefix)) {
    throw new ImageUploadValidationError('Chave de armazenamento inválida.');
  }

  const afterPrefix = input.storageKey.slice(prefix.length);
  const slash = afterPrefix.indexOf('/');
  if (slash < 0) {
    throw new ImageUploadValidationError('Chave de armazenamento inválida.');
  }
  const userSeg = afterPrefix.slice(0, slash);
  if (userSeg !== safeUserSegment(input.userId)) {
    throw new ImageUploadValidationError('Chave de armazenamento inválida para este usuário.');
  }
}
