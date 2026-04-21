import { randomUUID } from 'node:crypto';
import { EmailStatus } from '@/domain/email/entity/email-status';
import { EmailMetadata } from '@/domain/email/entity/processed-email';
import {
  EmailSender,
  InvalidEmailInputError,
  InvalidSenderError,
  SendEmailInput,
  SendEmailResult,
  SendEmailResultItem,
} from '@/domain/email/service/email-sender.interface';
import { ProcessedEmailRepositoryInterface } from '@/domain/email/repository/processed-email-repository.interface';
import { DEFAULT_FROM_ADDRESS, isAllowedSenderDomain } from './email-defaults';
import { ProviderEmailGateway } from './provider-email-gateway';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PersistingEmailSenderOptions {
  resentFromId?: string;
  resentByUserId?: string;
}

export class PersistingEmailSender implements EmailSender {
  constructor(
    private readonly repository: ProcessedEmailRepositoryInterface,
    private readonly gateway: ProviderEmailGateway,
  ) {}

  async sendEmail(
    input: SendEmailInput,
    options: PersistingEmailSenderOptions = {},
  ): Promise<SendEmailResult> {
    const { recipients, userIds, isFanOut } = this.normalizeRecipients(input);
    const from = this.resolveFrom(input.from);
    const subject = this.validateSubject(input.subject);
    const html = this.validateHtml(input.html);
    const metadataBase = this.normalizeMetadata(input.metadata);
    const groupId = isFanOut ? randomUUID() : undefined;
    if (groupId) metadataBase.groupId = groupId;

    const items: SendEmailResultItem[] = [];

    for (let index = 0; index < recipients.length; index += 1) {
      const toAddress = recipients[index];
      const recipientUserId = userIds?.[index] ?? null;
      const itemMetadata: EmailMetadata = { ...metadataBase };

      const created = await this.repository.create({
        provider: this.gateway.provider,
        fromAddress: from,
        toAddress,
        recipientUserId,
        ccAddresses: input.cc?.length ? input.cc : null,
        bccAddresses: input.bcc?.length ? input.bcc : null,
        replyToAddress: input.replyTo ?? null,
        subject,
        htmlBody: html,
        textBody: input.text ?? null,
        tags: input.tags?.length ? input.tags : null,
        metadata: itemMetadata,
        templateName: input.templateName ?? null,
        idempotencyKey: input.idempotencyKey ?? null,
        status: EmailStatus.QUEUED,
        resentFromId: options.resentFromId ?? null,
        resentByUserId: options.resentByUserId ?? null,
      });

      const providerOutput = await this.gateway.send({
        from,
        to: toAddress,
        subject,
        html,
        text: input.text,
        replyTo: input.replyTo,
        cc: input.cc,
        bcc: input.bcc,
        tags: input.tags,
      });

      if (providerOutput.status === 'sent') {
        await this.repository.updateAfterSend({
          id: created.id,
          providerMessageId: providerOutput.providerMessageId,
          status: EmailStatus.SENT,
          lastProviderError: null,
        });
        items.push({
          processedEmailId: created.id,
          providerMessageId: providerOutput.providerMessageId,
          status: 'sent',
        });
      } else if (providerOutput.status === 'suppressed') {
        await this.repository.updateAfterSend({
          id: created.id,
          providerMessageId: null,
          status: EmailStatus.SUPPRESSED_IN_ENV,
          lastProviderError: null,
        });
        items.push({
          processedEmailId: created.id,
          providerMessageId: null,
          status: 'suppressed',
        });
      } else {
        await this.repository.updateAfterSend({
          id: created.id,
          providerMessageId: null,
          status: EmailStatus.FAILED,
          lastProviderError: providerOutput.error,
        });
        items.push({
          processedEmailId: created.id,
          providerMessageId: null,
          status: 'failed',
          error: providerOutput.error,
        });
      }
    }

    return { items, groupId };
  }

  private resolveFrom(rawFrom: string | undefined): string {
    const from = rawFrom?.trim() || DEFAULT_FROM_ADDRESS;
    if (!isAllowedSenderDomain(from)) {
      throw new InvalidSenderError(
        `Sender domain not allowed. Received "${from}". Configure the domain in ALLOWED_SENDER_DOMAINS.`,
      );
    }
    return from;
  }

  private validateSubject(subject: string): string {
    const trimmed = (subject ?? '').trim();
    if (!trimmed) {
      throw new InvalidEmailInputError('subject is required');
    }
    return trimmed;
  }

  private validateHtml(html: string): string {
    if (!html || !html.trim()) {
      throw new InvalidEmailInputError('html body is required');
    }
    return html;
  }

  private normalizeRecipients(input: SendEmailInput): {
    recipients: string[];
    userIds: (string | null)[] | null;
    isFanOut: boolean;
  } {
    const rawTo = input.to;
    if (typeof rawTo === 'string') {
      const trimmed = rawTo.trim();
      if (!trimmed) {
        throw new InvalidEmailInputError('to is required');
      }

      let recipientUserId: string | null = null;
      if (input.recipientUserId !== undefined) {
        if (Array.isArray(input.recipientUserId)) {
          throw new InvalidEmailInputError(
            'recipientUserId must be a string (or omitted) when "to" is a string',
          );
        }
        recipientUserId = this.validateUserId(input.recipientUserId);
      }

      return {
        recipients: [trimmed],
        userIds: recipientUserId !== null ? [recipientUserId] : null,
        isFanOut: false,
      };
    }

    if (!Array.isArray(rawTo) || rawTo.length === 0) {
      throw new InvalidEmailInputError('to must be a non-empty string or string[]');
    }

    const recipients = rawTo.map((value, index) => {
      const trimmed = value?.trim?.();
      if (!trimmed) {
        throw new InvalidEmailInputError(`to[${index}] is empty`);
      }
      return trimmed;
    });

    let userIds: (string | null)[] | null = null;
    if (input.recipientUserId !== undefined) {
      if (!Array.isArray(input.recipientUserId)) {
        throw new InvalidEmailInputError(
          'recipientUserId must be a string[] (or omitted) when "to" is an array',
        );
      }
      if (input.recipientUserId.length !== recipients.length) {
        throw new InvalidEmailInputError(
          `recipientUserId array length (${input.recipientUserId.length}) must match "to" array length (${recipients.length})`,
        );
      }
      userIds = input.recipientUserId.map((value) => this.validateUserId(value));
    }

    return { recipients, userIds, isFanOut: true };
  }

  private validateUserId(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;
    if (!UUID_REGEX.test(trimmed)) {
      throw new InvalidEmailInputError(`recipientUserId is not a valid UUID: ${value}`);
    }
    return trimmed;
  }

  private normalizeMetadata(metadata: EmailMetadata | undefined): EmailMetadata {
    if (!metadata) return {};
    const out: EmailMetadata = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (value === undefined || value === null) continue;
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        out[key] = value;
      } else {
        throw new InvalidEmailInputError(
          `metadata["${key}"] must be string | number | boolean`,
        );
      }
    }
    return out;
  }
}
