import { ProcessedEmailRepositoryInterface } from '@/domain/email/repository/processed-email-repository.interface';
import { EmailDeliveryPolicy } from './email-delivery-policy';
import { NoopEmailGateway } from './noop-email-gateway';
import { PersistingEmailSender } from './persisting-email-sender';
import { ProviderEmailGateway } from './provider-email-gateway';
import { ResendEmailGateway } from './resend-email-gateway';
import { DrizzleProcessedEmailRepository } from '@/infrastructure/repositories/drizzle/drizzle-processed-email.repository';

function buildGateway(): ProviderEmailGateway {
  const policy = new EmailDeliveryPolicy();
  if (!policy.shouldDeliver()) return new NoopEmailGateway();

  const provider = process.env.EMAIL_PROVIDER ?? 'resend';
  if (provider === 'noop') return new NoopEmailGateway();

  if (provider === 'resend') {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        'EMAIL_PROVIDER=resend requires RESEND_API_KEY. Set it or switch to noop in non-prod.',
      );
    }
    return new ResendEmailGateway(apiKey);
  }

  throw new Error(`Unsupported EMAIL_PROVIDER: ${provider}`);
}

let cachedRepository: ProcessedEmailRepositoryInterface | null = null;
let cachedSender: PersistingEmailSender | null = null;

export function getProcessedEmailRepository(): ProcessedEmailRepositoryInterface {
  if (!cachedRepository) cachedRepository = new DrizzleProcessedEmailRepository();
  return cachedRepository;
}

export function getEmailSender(): PersistingEmailSender {
  if (!cachedSender) {
    cachedSender = new PersistingEmailSender(getProcessedEmailRepository(), buildGateway());
  }
  return cachedSender;
}
