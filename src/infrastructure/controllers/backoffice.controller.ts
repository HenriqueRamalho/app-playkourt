import { NextRequest, NextResponse } from 'next/server';
import { ListUsersForBackofficeUseCase } from '@/application/use-cases/backoffice/ListUsersForBackofficeUseCase';
import { DrizzleBackofficeUserRepository } from '@/infrastructure/repositories/drizzle/drizzle-backoffice-user.repository';

export class BackofficeController {
  static async listUsers(req: NextRequest): Promise<NextResponse> {
    try {
      const params = req.nextUrl.searchParams;

      const page = this.parseOptionalInt(params.get('page'));
      const pageSize = this.parseOptionalInt(params.get('pageSize'));
      const banned = this.parseOptionalBoolean(params.get('banned'));

      const repository = new DrizzleBackofficeUserRepository();
      const useCase = new ListUsersForBackofficeUseCase(repository);

      const result = await useCase.execute({
        id: params.get('id') ?? undefined,
        email: params.get('email') ?? undefined,
        name: params.get('name') ?? undefined,
        banned,
        page,
        pageSize,
      });
      console.log('test: ', result.items)
      return NextResponse.json({
        data: result.items.map((item) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          banned: item.banned,
          banReason: item.banReason,
          banSource: item.banSource,
          bannedAt: item.bannedAt ? item.bannedAt.toISOString() : null,
          emailVerified: item.emailVerified,
          createdAt: item.createdAt.toISOString(),
          lastSeenAt: item.lastSeenAt ? item.lastSeenAt.toISOString() : null,
        })),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      const status = message.startsWith('Invalid') || message.startsWith('Filter') ? 400 : 500;
      return NextResponse.json({ error: message }, { status });
    }
  }

  private static parseOptionalInt(value: string | null): number | undefined {
    if (value === null || value === '') return undefined;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) throw new Error(`Invalid numeric parameter: ${value}`);
    return parsed;
  }

  private static parseOptionalBoolean(value: string | null): boolean | undefined {
    if (value === null || value === '') return undefined;
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new Error(`Invalid boolean parameter: ${value}`);
  }
}
