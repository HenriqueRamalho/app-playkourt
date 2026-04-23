export interface S3UploadConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  cdnBaseUrl: string;
  keyPrefix: string;
  presignExpiresSeconds: number;
  maxBytes: number;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function resolveS3UploadConfig(): S3UploadConfig | null {
  const bucket = process.env.S3_BUCKET_NAME?.trim();
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_URL?.trim().replace(/\/$/, '');

  if (!bucket || !accessKeyId || !secretAccessKey || !cdnBaseUrl) {
    return null;
  }

  const region = process.env.AWS_REGION?.trim() || '';
  const keyPrefix = (process.env.S3_UPLOAD_KEY_PREFIX?.trim() || 'uploads').replace(/^\/+|\/+$/g, '');
  const presignExpiresSeconds = Math.min(
    3600,
    Math.max(60, parsePositiveInt(process.env.S3_PRESIGN_EXPIRES_SECONDS, 900)),
  );
  const maxBytes = Math.min(
    50 * 1024 * 1024,
    Math.max(1024, parsePositiveInt(process.env.S3_UPLOAD_MAX_BYTES, 10 * 1024 * 1024)),
  );

  return {
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    cdnBaseUrl,
    keyPrefix,
    presignExpiresSeconds,
    maxBytes,
  };
}
