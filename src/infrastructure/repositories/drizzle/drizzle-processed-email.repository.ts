import { and, asc, desc, eq, gte, ilike, lte, sql, SQL } from 'drizzle-orm';
import { getDb } from '@/infrastructure/database/drizzle/client';
import {
  processedEmails,
  processedEmailEvents,
} from '@/infrastructure/database/drizzle/schema/email';
import { EmailProvider, parseEmailProvider } from '@/domain/email/entity/email-provider';
import { EmailStatus, parseEmailStatus } from '@/domain/email/entity/email-status';
import { ProviderStatus, parseProviderStatus } from '@/domain/email/entity/provider-status';
import { EmailMetadata, ProcessedEmail } from '@/domain/email/entity/processed-email';
import {
  CreateProcessedEmailInput,
  ListProcessedEmailsCriteria,
  ListProcessedEmailsResult,
  ProcessedEmailDetail,
  ProcessedEmailEvent,
  ProcessedEmailListItem,
  ProcessedEmailRepositoryInterface,
  RecordProviderEventInput,
  UpdateProcessedEmailAfterSendInput,
} from '@/domain/email/repository/processed-email-repository.interface';

type ProcessedEmailRow = typeof processedEmails.$inferSelect;
type ProcessedEmailEventRow = typeof processedEmailEvents.$inferSelect;

const EVENTS_DETAIL_LIMIT = 50;

export class DrizzleProcessedEmailRepository implements ProcessedEmailRepositoryInterface {
  async create(input: CreateProcessedEmailInput): Promise<ProcessedEmail> {
    const db = getDb();
    const [row] = await db
      .insert(processedEmails)
      .values({
        provider: input.provider,
        fromAddress: input.fromAddress,
        toAddress: input.toAddress,
        recipientUserId: input.recipientUserId,
        ccAddresses: input.ccAddresses,
        bccAddresses: input.bccAddresses,
        replyToAddress: input.replyToAddress,
        subject: input.subject,
        htmlBody: input.htmlBody,
        textBody: input.textBody,
        tags: input.tags,
        metadata: input.metadata,
        templateName: input.templateName,
        idempotencyKey: input.idempotencyKey,
        status: input.status,
        resentFromId: input.resentFromId,
        resentByUserId: input.resentByUserId,
      })
      .returning();

    return this.mapRow(row);
  }

  async updateAfterSend(input: UpdateProcessedEmailAfterSendInput): Promise<void> {
    const db = getDb();
    await db
      .update(processedEmails)
      .set({
        providerMessageId: input.providerMessageId,
        status: input.status,
        lastProviderError: input.lastProviderError,
      })
      .where(eq(processedEmails.id, input.id));
  }

  async list(criteria: ListProcessedEmailsCriteria): Promise<ListProcessedEmailsResult> {
    const db = getDb();
    const conditions = this.buildListWhere(criteria);
    const whereClause = conditions.length ? and(...conditions) : undefined;
    const offset = (criteria.page - 1) * criteria.pageSize;

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          id: processedEmails.id,
          provider: processedEmails.provider,
          providerMessageId: processedEmails.providerMessageId,
          toAddress: processedEmails.toAddress,
          recipientUserId: processedEmails.recipientUserId,
          fromAddress: processedEmails.fromAddress,
          subject: processedEmails.subject,
          templateName: processedEmails.templateName,
          status: processedEmails.status,
          lastProviderStatus: processedEmails.lastProviderStatus,
          lastProviderStatusAt: processedEmails.lastProviderStatusAt,
          createdAt: processedEmails.createdAt,
          resentFromId: processedEmails.resentFromId,
        })
        .from(processedEmails)
        .where(whereClause)
        .orderBy(desc(processedEmails.createdAt), asc(processedEmails.id))
        .limit(criteria.pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(processedEmails)
        .where(whereClause),
    ]);

    const items: ProcessedEmailListItem[] = rows.map((row) => ({
      id: row.id,
      provider: parseEmailProvider(row.provider) ?? EmailProvider.NOOP,
      providerMessageId: row.providerMessageId,
      toAddress: row.toAddress,
      recipientUserId: row.recipientUserId,
      fromAddress: row.fromAddress,
      subject: row.subject,
      templateName: row.templateName,
      status: parseEmailStatus(row.status),
      lastProviderStatus: parseProviderStatus(row.lastProviderStatus),
      lastProviderStatusAt: row.lastProviderStatusAt,
      createdAt: row.createdAt,
      resentFromId: row.resentFromId,
    }));

    return {
      items,
      total: totalRows[0]?.count ?? 0,
      page: criteria.page,
      pageSize: criteria.pageSize,
    };
  }

  async findById(id: string): Promise<ProcessedEmailDetail | null> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(processedEmails)
      .where(eq(processedEmails.id, id))
      .limit(1);
    if (!row) return null;

    const eventRows = await db
      .select()
      .from(processedEmailEvents)
      .where(eq(processedEmailEvents.processedEmailId, id))
      .orderBy(desc(processedEmailEvents.occurredAt))
      .limit(EVENTS_DETAIL_LIMIT);

    const events: ProcessedEmailEvent[] = eventRows.map((event) => this.mapEventRow(event));

    return { ...this.mapRow(row), events };
  }

  async findByProviderMessageId(
    provider: EmailProvider,
    providerMessageId: string,
  ): Promise<ProcessedEmail | null> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(processedEmails)
      .where(
        and(
          eq(processedEmails.provider, provider),
          eq(processedEmails.providerMessageId, providerMessageId),
        ),
      )
      .limit(1);
    if (!row) return null;
    return this.mapRow(row);
  }

  async recordProviderEvent(input: RecordProviderEventInput): Promise<boolean> {
    const db = getDb();

    const inserted = await db
      .insert(processedEmailEvents)
      .values({
        processedEmailId: input.processedEmailId,
        providerEventId: input.providerEventId,
        provider: input.provider,
        rawStatus: input.rawStatus,
        normalizedStatus: input.normalizedStatus,
        payload: input.payload as Record<string, unknown>,
        occurredAt: input.occurredAt,
      })
      .onConflictDoNothing({
        target: [
          processedEmailEvents.processedEmailId,
          processedEmailEvents.providerEventId,
        ],
      })
      .returning({ id: processedEmailEvents.id });

    if (inserted.length === 0) return false;

    const updates: Partial<typeof processedEmails.$inferInsert> = {
      lastProviderStatus: input.normalizedStatus,
      lastProviderStatusAt: input.occurredAt,
    };

    if (input.normalizedStatus === ProviderStatus.DELIVERED) {
      updates.status = EmailStatus.DELIVERED;
      updates.deliveredAt = input.occurredAt;
    } else if (
      input.normalizedStatus === ProviderStatus.BOUNCED ||
      input.normalizedStatus === ProviderStatus.FAILED
    ) {
      updates.status = EmailStatus.FAILED;
    }

    await db
      .update(processedEmails)
      .set(updates)
      .where(eq(processedEmails.id, input.processedEmailId));

    return true;
  }

  private buildListWhere(criteria: ListProcessedEmailsCriteria): SQL[] {
    const conditions: SQL[] = [];
    if (criteria.sentFrom) {
      conditions.push(gte(processedEmails.createdAt, criteria.sentFrom));
    }
    if (criteria.sentTo) {
      conditions.push(lte(processedEmails.createdAt, criteria.sentTo));
    }
    if (criteria.to) {
      conditions.push(ilike(processedEmails.toAddress, `%${criteria.to}%`));
    }
    if (criteria.subject) {
      conditions.push(ilike(processedEmails.subject, `%${criteria.subject}%`));
    }
    if (criteria.from) {
      conditions.push(ilike(processedEmails.fromAddress, `%${criteria.from}%`));
    }
    if (criteria.recipientUserId) {
      conditions.push(eq(processedEmails.recipientUserId, criteria.recipientUserId));
    }
    if (criteria.metadataKey && criteria.metadataValue !== undefined) {
      conditions.push(
        sql`${processedEmails.metadata} ->> ${criteria.metadataKey} = ${criteria.metadataValue}`,
      );
    }
    if (criteria.provider) {
      conditions.push(eq(processedEmails.provider, criteria.provider));
    }
    if (criteria.status) {
      conditions.push(eq(processedEmails.lastProviderStatus, criteria.status));
    }
    return conditions;
  }

  private mapRow(row: ProcessedEmailRow): ProcessedEmail {
    return {
      id: row.id,
      provider: parseEmailProvider(row.provider) ?? EmailProvider.NOOP,
      providerMessageId: row.providerMessageId,
      fromAddress: row.fromAddress,
      toAddress: row.toAddress,
      recipientUserId: row.recipientUserId,
      ccAddresses: row.ccAddresses ?? null,
      bccAddresses: row.bccAddresses ?? null,
      replyToAddress: row.replyToAddress,
      subject: row.subject,
      htmlBody: row.htmlBody,
      textBody: row.textBody,
      tags: row.tags ?? null,
      metadata: this.toMetadata(row.metadata),
      templateName: row.templateName,
      idempotencyKey: row.idempotencyKey,
      status: parseEmailStatus(row.status),
      lastProviderStatus: parseProviderStatus(row.lastProviderStatus),
      lastProviderStatusAt: row.lastProviderStatusAt,
      lastProviderError: row.lastProviderError,
      resentFromId: row.resentFromId,
      resentByUserId: row.resentByUserId,
      createdAt: row.createdAt,
      deliveredAt: row.deliveredAt,
    };
  }

  private mapEventRow(row: ProcessedEmailEventRow): ProcessedEmailEvent {
    return {
      id: row.id,
      providerEventId: row.providerEventId,
      provider: parseEmailProvider(row.provider) ?? EmailProvider.NOOP,
      rawStatus: row.rawStatus,
      normalizedStatus:
        parseProviderStatus(row.normalizedStatus) ?? ProviderStatus.FAILED,
      occurredAt: row.occurredAt,
      receivedAt: row.receivedAt,
    };
  }

  private toMetadata(value: unknown): EmailMetadata {
    if (!value || typeof value !== 'object') return {};
    const out: EmailMetadata = {};
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
        out[key] = raw;
      } else if (raw !== null && raw !== undefined) {
        out[key] = String(raw);
      }
    }
    return out;
  }
}
