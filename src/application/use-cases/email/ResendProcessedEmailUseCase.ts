import { ProcessedEmailRepositoryInterface } from '@/domain/email/repository/processed-email-repository.interface';
import { SendEmailResult } from '@/domain/email/service/email-sender.interface';
import { PersistingEmailSender } from '@/infrastructure/services/email/persisting-email-sender';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ProcessedEmailNotFoundError extends Error {
  constructor() {
    super('Processed email not found');
    this.name = 'ProcessedEmailNotFoundError';
  }
}

export interface ResendProcessedEmailInput {
  id: string;
  actorId: string;
  reason?: string;
}

export class ResendProcessedEmailUseCase {
  constructor(
    private readonly repository: ProcessedEmailRepositoryInterface,
    private readonly emailSender: PersistingEmailSender,
  ) {}

  async execute(input: ResendProcessedEmailInput): Promise<SendEmailResult> {
    const id = input.id?.trim();
    if (!id || !UUID_REGEX.test(id)) {
      throw new Error('Invalid id: expected a UUID');
    }
    const actorId = input.actorId?.trim();
    if (!actorId || !UUID_REGEX.test(actorId)) {
      throw new Error('Invalid actorId: expected a UUID');
    }

    const original = await this.repository.findById(id);
    if (!original) throw new ProcessedEmailNotFoundError();

    const metadata = { ...original.metadata };
    const trimmedReason = input.reason?.trim();
    if (trimmedReason) metadata.resendReason = trimmedReason;

    return this.emailSender.sendEmail(
      {
        to: original.toAddress,
        recipientUserId: original.recipientUserId ?? undefined,
        from: original.fromAddress,
        subject: original.subject,
        html: original.htmlBody,
        text: original.textBody ?? undefined,
        replyTo: original.replyToAddress ?? undefined,
        cc: original.ccAddresses ?? undefined,
        bcc: original.bccAddresses ?? undefined,
        tags: original.tags ?? undefined,
        metadata,
        templateName: original.templateName ?? undefined,
      },
      { resentFromId: original.id, resentByUserId: actorId },
    );
  }
}
