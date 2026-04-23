import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { resolveS3UploadConfig, type S3UploadConfig } from '@/infrastructure/services/storage/storage-env';

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

const MIME_TO_EXT: Record<AllowedContentType, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export class StorageConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageConfigError';
  }
}

export class StorageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageValidationError';
  }
}

export interface PresignedImageUploadInput {
  userId: string;
  contentType: string;
  contentLength: number;
}

export interface PresignedImageUploadResult {
  uploadUrl: string;
  method: 'PUT';
  /** Cabeçalhos que o cliente deve enviar no PUT (assinatura inclui estes valores). */
  headers: Record<string, string>;
  key: string;
  /** URL pública servida pelo CloudFront após o upload concluir. */
  publicUrl: string;
  expiresInSeconds: number;
}

let s3Client: S3Client | null = null;
let clientConfigKey: string | null = null;

function getS3Client(config: S3UploadConfig): S3Client {
  const key = `${config.region}:${config.accessKeyId}`;
  if (!s3Client || clientConfigKey !== key) {
    s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    clientConfigKey = key;
  }
  return s3Client;
}

function assertAllowedContentType(contentType: string): asserts contentType is AllowedContentType {
  if (!ALLOWED_CONTENT_TYPES.includes(contentType as AllowedContentType)) {
    throw new StorageValidationError(
      `Tipo de arquivo não permitido. Use: ${ALLOWED_CONTENT_TYPES.join(', ')}.`,
    );
  }
}

function buildObjectKey(config: S3UploadConfig, userId: string, ext: string): string {
  const safeUser = userId.replace(/[^a-zA-Z0-9-]/g, '') || 'user';
  const id = randomUUID();
  return `${config.keyPrefix}/${safeUser}/${id}${ext}`;
}

/**
 * Gera URL assinada para PUT direto no S3. O objeto fica privado no bucket;
 * leitura pública ocorre via CloudFront (OAC) usando {@link PresignedImageUploadResult.publicUrl}.
 */
export async function createPresignedImageUpload(
  input: PresignedImageUploadInput,
): Promise<PresignedImageUploadResult> {
  const config = resolveS3UploadConfig();
  if (!config) {
    throw new StorageConfigError(
      'Armazenamento S3 não configurado. Defina S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY e NEXT_PUBLIC_CDN_URL.',
    );
  }

  const contentType = input.contentType?.trim().toLowerCase();
  if (!contentType) {
    throw new StorageValidationError('contentType é obrigatório.');
  }
  assertAllowedContentType(contentType);

  const len = input.contentLength;
  if (!Number.isFinite(len) || len < 1) {
    throw new StorageValidationError('contentLength inválido.');
  }
  if (len > config.maxBytes) {
    throw new StorageValidationError(`Arquivo acima do limite de ${config.maxBytes} bytes.`);
  }

  const ext = MIME_TO_EXT[contentType];
  const key = buildObjectKey(config, input.userId, ext);

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: len,
    CacheControl: 'public, max-age=31536000, immutable',
  });

  const client = getS3Client(config);
  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: config.presignExpiresSeconds,
  });

  const publicUrl = `${config.cdnBaseUrl}/${key}`;

  return {
    uploadUrl,
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(len),
    },
    key,
    publicUrl,
    expiresInSeconds: config.presignExpiresSeconds,
  };
}
