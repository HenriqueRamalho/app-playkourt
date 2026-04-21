import { EmailProvider } from '@/domain/email/entity/email-provider';
import { ProcessedEmailRepositoryInterface } from '@/domain/email/repository/processed-email-repository.interface';
import { NormalizedEmailEvent } from '@/infrastructure/services/email/resend-event-normalizer';

export interface RecordEmailProviderEventResult {
  recorded: boolean;
  reason?: 'duplicate' | 'email_not_found';
}

export class RecordEmailProviderEventUseCase {
  constructor(private readonly repository: ProcessedEmailRepositoryInterface) {}

  async execute(event: NormalizedEmailEvent): Promise<RecordEmailProviderEventResult> {
    const processedEmail = await this.repository.findByProviderMessageId(
      event.provider,
      event.providerMessageId,
    );

    if (!processedEmail) {
      return { recorded: false, reason: 'email_not_found' };
    }

    const recorded = await this.repository.recordProviderEvent({
      processedEmailId: processedEmail.id,
      providerEventId: event.providerEventId,
      provider: event.provider as EmailProvider,
      rawStatus: event.rawStatus,
      normalizedStatus: event.normalizedStatus,
      payload: event.payload,
      occurredAt: event.occurredAt,
    });

    if (!recorded) return { recorded: false, reason: 'duplicate' };
    return { recorded: true };
  }
}
