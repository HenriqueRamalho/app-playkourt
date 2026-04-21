import { EmailProvider } from '@/domain/email/entity/email-provider';
import { ProviderEmailGateway, ProviderSendInput, ProviderSendOutput } from './provider-email-gateway';

interface ResendResponse {
  id?: string;
  data?: { id?: string };
  error?: { message?: string; name?: string };
  message?: string;
}

export class ResendEmailGateway implements ProviderEmailGateway {
  readonly provider = EmailProvider.RESEND;

  constructor(private readonly apiKey: string) {
    if (!apiKey) {
      throw new Error('ResendEmailGateway requires a non-empty apiKey');
    }
  }

  async send(input: ProviderSendInput): Promise<ProviderSendOutput> {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: input.from,
          to: [input.to],
          subject: input.subject,
          html: input.html,
          text: input.text,
          reply_to: input.replyTo,
          cc: input.cc,
          bcc: input.bcc,
          tags: input.tags?.map((name) => ({ name, value: 'true' })),
          headers: input.headers,
        }),
      });

      const body = (await res.json().catch(() => ({}))) as ResendResponse;

      if (!res.ok) {
        const error = body.error?.message || body.message || `Resend API error ${res.status}`;
        return { status: 'failed', error };
      }

      const providerMessageId = body.id ?? body.data?.id;
      if (!providerMessageId) {
        return {
          status: 'failed',
          error: 'Resend response did not include a message id',
        };
      }

      return { status: 'sent', providerMessageId };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error sending email via Resend';
      return { status: 'failed', error: message };
    }
  }
}
