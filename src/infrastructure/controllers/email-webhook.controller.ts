import { NextRequest, NextResponse } from 'next/server';
import { RecordEmailProviderEventUseCase } from '@/application/use-cases/email/RecordEmailProviderEventUseCase';
import { ResendEventNormalizer } from '@/infrastructure/services/email/resend-event-normalizer';
import { getProcessedEmailRepository } from '@/infrastructure/services/email/email-container';
import { verifySvixSignature } from '../services/email/svix-verifier';

export class EmailWebhookController {
  static async resendWebhook(req: NextRequest): Promise<NextResponse> {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 },
      );
    }

    const rawBody = await req.text();

    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: 'Missing Svix headers' }, { status: 401 });
    }

    const signatureValid = await verifySvixSignature({
      secret,
      svixId,
      svixTimestamp,
      svixSignature,
      payload: rawBody,
    });

    if (!signatureValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const normalizer = new ResendEventNormalizer();
    const normalized = normalizer.normalize(parsedBody, svixId);
    if (!normalized) {
      return NextResponse.json(
        { ok: true, reason: 'unsupported_event' },
        { status: 200 },
      );
    }

    try {
      const useCase = new RecordEmailProviderEventUseCase(getProcessedEmailRepository());
      const result = await useCase.execute(normalized);
      return NextResponse.json({ ok: true, recorded: result.recorded, reason: result.reason });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
}
