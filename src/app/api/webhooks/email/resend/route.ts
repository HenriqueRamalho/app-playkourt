import { NextRequest } from 'next/server';
import { EmailWebhookController } from '@/infrastructure/controllers/email-webhook.controller';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return EmailWebhookController.resendWebhook(req);
}
