import { render } from '@react-email/render';
import { EmailVerificationEmail } from './templates/email-verification';
import type { EmailVerificationProps } from './templates/email-verification';
import { PasswordResetEmail } from './templates/password-reset';
import type { PasswordResetEmailProps } from './templates/password-reset';

export async function renderEmailVerificationEmail(
  props: EmailVerificationProps,
): Promise<{ html: string; text: string }> {
  const element = <EmailVerificationEmail {...props} />;
  const [html, text] = await Promise.all([
    render(element, { pretty: false }),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

export async function renderPasswordResetEmail(
  props: PasswordResetEmailProps,
): Promise<{ html: string; text: string }> {
  const element = <PasswordResetEmail {...props} />;
  const [html, text] = await Promise.all([
    render(element, { pretty: false }),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}
