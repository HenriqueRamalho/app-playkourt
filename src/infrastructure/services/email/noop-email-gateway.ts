import { EmailProvider } from '@/domain/email/entity/email-provider';
import { ProviderEmailGateway, ProviderSendOutput } from './provider-email-gateway';

export class NoopEmailGateway implements ProviderEmailGateway {
  readonly provider = EmailProvider.NOOP;

  async send(): Promise<ProviderSendOutput> {
    return { status: 'suppressed' };
  }
}
