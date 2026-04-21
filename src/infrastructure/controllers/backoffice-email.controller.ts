import { NextRequest, NextResponse } from 'next/server';
import {
  GetProcessedEmailForBackofficeUseCase,
} from '@/application/use-cases/email/GetProcessedEmailForBackofficeUseCase';
import {
  ListProcessedEmailsForBackofficeUseCase,
} from '@/application/use-cases/email/ListProcessedEmailsForBackofficeUseCase';
import {
  ProcessedEmailNotFoundError,
  ResendProcessedEmailUseCase,
} from '@/application/use-cases/email/ResendProcessedEmailUseCase';
import {
  InvalidEmailInputError,
  InvalidSenderError,
} from '@/domain/email/service/email-sender.interface';
import { AuthUser } from '@/infrastructure/frontend-services/auth/auth.service';
import {
  getEmailSender,
  getProcessedEmailRepository,
} from '@/infrastructure/services/email/email-container';

export class BackofficeEmailController {
  static async list(req: NextRequest): Promise<NextResponse> {
    try {
      const params = req.nextUrl.searchParams;

      const useCase = new ListProcessedEmailsForBackofficeUseCase(
        getProcessedEmailRepository(),
      );

      const result = await useCase.execute({
        sentFrom: params.get('sentFrom') ?? undefined,
        sentTo: params.get('sentTo') ?? undefined,
        to: params.get('to') ?? undefined,
        subject: params.get('subject') ?? undefined,
        from: params.get('from') ?? undefined,
        recipientUserId: params.get('recipientUserId') ?? undefined,
        metadataKey: params.get('metadataKey') ?? undefined,
        metadataValue: params.get('metadataValue') ?? undefined,
        provider: params.get('provider') ?? undefined,
        status: params.get('status') ?? undefined,
        page: this.parseOptionalInt(params.get('page')),
        pageSize: this.parseOptionalInt(params.get('pageSize')),
      });

      return NextResponse.json({
        data: result.items.map((item) => ({
          id: item.id,
          provider: item.provider,
          providerMessageId: item.providerMessageId,
          to: item.toAddress,
          recipientUserId: item.recipientUserId,
          from: item.fromAddress,
          subject: item.subject,
          templateName: item.templateName,
          status: item.status,
          lastProviderStatus: item.lastProviderStatus,
          lastProviderStatusAt: item.lastProviderStatusAt
            ? item.lastProviderStatusAt.toISOString()
            : null,
          createdAt: item.createdAt.toISOString(),
          resentFromId: item.resentFromId,
        })),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      });
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  static async get(_req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const useCase = new GetProcessedEmailForBackofficeUseCase(
        getProcessedEmailRepository(),
      );
      const detail = await useCase.execute(id);
      if (!detail) {
        return NextResponse.json({ error: 'Email not found' }, { status: 404 });
      }

      return NextResponse.json({
        id: detail.id,
        provider: detail.provider,
        providerMessageId: detail.providerMessageId,
        to: detail.toAddress,
        recipientUserId: detail.recipientUserId,
        from: detail.fromAddress,
        cc: detail.ccAddresses,
        bcc: detail.bccAddresses,
        replyTo: detail.replyToAddress,
        subject: detail.subject,
        htmlBody: detail.htmlBody,
        textBody: detail.textBody,
        tags: detail.tags,
        metadata: detail.metadata,
        templateName: detail.templateName,
        status: detail.status,
        lastProviderStatus: detail.lastProviderStatus,
        lastProviderStatusAt: detail.lastProviderStatusAt
          ? detail.lastProviderStatusAt.toISOString()
          : null,
        lastProviderError: detail.lastProviderError,
        resentFromId: detail.resentFromId,
        resentByUserId: detail.resentByUserId,
        createdAt: detail.createdAt.toISOString(),
        deliveredAt: detail.deliveredAt ? detail.deliveredAt.toISOString() : null,
        events: detail.events.map((event) => ({
          id: event.id,
          provider: event.provider,
          providerEventId: event.providerEventId,
          rawStatus: event.rawStatus,
          normalizedStatus: event.normalizedStatus,
          occurredAt: event.occurredAt.toISOString(),
          receivedAt: event.receivedAt.toISOString(),
        })),
      });
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  static async resend(
    req: NextRequest,
    actor: AuthUser,
    id: string,
  ): Promise<NextResponse> {
    try {
      const body = await this.readJsonBody(req);
      const reason = typeof body?.reason === 'string' ? body.reason : undefined;

      const useCase = new ResendProcessedEmailUseCase(
        getProcessedEmailRepository(),
        getEmailSender(),
      );

      const result = await useCase.execute({ id, actorId: actor.id, reason });
      const newRecord = result.items[0];

      return NextResponse.json(
        {
          id: newRecord?.processedEmailId ?? null,
          status: newRecord?.status ?? null,
        },
        { status: 202 },
      );
    } catch (error) {
      if (error instanceof ProcessedEmailNotFoundError) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return this.toErrorResponse(error);
    }
  }

  private static async readJsonBody(req: NextRequest): Promise<Record<string, unknown> | null> {
    try {
      const text = await req.text();
      if (!text) return null;
      const parsed = JSON.parse(text);
      return typeof parsed === 'object' && parsed !== null
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      throw new Error('Invalid JSON body');
    }
  }

  private static parseOptionalInt(value: string | null): number | undefined {
    if (value === null || value === '') return undefined;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) throw new Error(`Invalid numeric parameter: ${value}`);
    return parsed;
  }

  private static toErrorResponse(error: unknown): NextResponse {
    if (error instanceof InvalidEmailInputError || error instanceof InvalidSenderError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    const isClientError = message.startsWith('Invalid');
    return NextResponse.json(
      { error: message },
      { status: isClientError ? 400 : 500 },
    );
  }
}
