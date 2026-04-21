import { cookies } from 'next/headers';
import { parseSetCookieHeader } from 'better-auth/cookies';

/**
 * Aplica `Set-Cookie` retornados por `auth.api.*` com `returnHeaders: true` ao cookie store do Next.js
 * (mesmo padrão do plugin `nextCookies` do Better Auth).
 */
export async function applyBetterAuthSetCookieHeaders(responseHeaders: Headers | null | undefined): Promise<void> {
  if (!responseHeaders) return;
  const setCookies = responseHeaders.get('set-cookie');
  if (!setCookies) return;

  const parsed = parseSetCookieHeader(setCookies);
  const cookieStore = await cookies();

  parsed.forEach((value, key) => {
    if (!key) return;
    const raw = value.samesite as string | undefined;
    let sameSite: 'strict' | 'lax' | 'none' | undefined;
    if (raw === 'strict' || raw === 'lax' || raw === 'none') sameSite = raw;
    else if (typeof raw === 'string') {
      const lower = raw.toLowerCase();
      if (lower === 'strict' || lower === 'lax' || lower === 'none') sameSite = lower;
    }

    const opts = {
      sameSite,
      secure: value.secure,
      maxAge: value['max-age'],
      httpOnly: value.httponly,
      domain: value.domain,
      path: value.path,
      expires: value.expires,
    };

    try {
      cookieStore.set(key, value.value, opts);
    } catch {
      // Ignora cookies inválidos em ambientes onde `cookies().set` não é permitido.
    }
  });
}
