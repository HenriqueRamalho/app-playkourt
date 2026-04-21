import { render } from '@react-email/render';
import { EmailVerificationEmail } from './templates/email-verification';
import type { EmailVerificationProps } from './templates/email-verification';

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
