import { createHmac, timingSafeEqual } from 'node:crypto';

export interface SvixVerifyInput {
  secret: string;
  svixId: string;
  svixTimestamp: string;
  svixSignature: string;
  payload: string;
  toleranceSeconds?: number;
}

const DEFAULT_TOLERANCE_SECONDS = 5 * 60;
const SECRET_PREFIX = 'whsec_';

export async function verifySvixSignature(input: SvixVerifyInput): Promise<boolean> {
  const tolerance = input.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;

  const timestampSeconds = Number(input.svixTimestamp);
  if (!Number.isFinite(timestampSeconds)) return false;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > tolerance) return false;

  const secret = input.secret.startsWith(SECRET_PREFIX)
    ? input.secret.slice(SECRET_PREFIX.length)
    : input.secret;

  let secretBytes: Buffer;
  try {
    secretBytes = Buffer.from(secret, 'base64');
  } catch {
    return false;
  }

  const signedContent = `${input.svixId}.${input.svixTimestamp}.${input.payload}`;
  const expectedSignature = createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64');

  const providedSignatures = input.svixSignature
    .split(' ')
    .map((sig) => sig.trim())
    .filter(Boolean)
    .map((sig) => {
      const [version, value] = sig.split(',', 2);
      return { version, value };
    })
    .filter(({ version, value }) => version === 'v1' && value);

  const expectedBuffer = Buffer.from(expectedSignature);

  return providedSignatures.some(({ value }) => {
    const providedBuffer = Buffer.from(value);
    if (providedBuffer.length !== expectedBuffer.length) return false;
    try {
      return timingSafeEqual(providedBuffer, expectedBuffer);
    } catch {
      return false;
    }
  });
}
