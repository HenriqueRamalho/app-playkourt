import { NextRequest, NextResponse } from 'next/server';
import { GetBackofficeUserOverviewUseCase } from '@/application/use-cases/backoffice/GetBackofficeUserOverviewUseCase';
import { ListBackofficeUserActiveSessionsUseCase } from '@/application/use-cases/backoffice/ListBackofficeUserActiveSessionsUseCase';
import { ListBackofficeUserBookingsUseCase } from '@/application/use-cases/backoffice/ListBackofficeUserBookingsUseCase';
import { ListBackofficeUserVenuesUseCase } from '@/application/use-cases/backoffice/ListBackofficeUserVenuesUseCase';
import { ListUsersForBackofficeUseCase } from '@/application/use-cases/backoffice/ListUsersForBackofficeUseCase';
import { DrizzleBackofficeUserRepository } from '@/infrastructure/repositories/drizzle/drizzle-backoffice-user.repository';

const CLIENT_ERROR_PREFIXES = ['Invalid', 'Filter'];

export class BackofficeController {
  static async listUsers(req: NextRequest): Promise<NextResponse> {
    try {
      const params = req.nextUrl.searchParams;

      const repository = new DrizzleBackofficeUserRepository();
      const useCase = new ListUsersForBackofficeUseCase(repository);

      const result = await useCase.execute({
        id: params.get('id') ?? undefined,
        email: params.get('email') ?? undefined,
        name: params.get('name') ?? undefined,
        banned: this.parseOptionalBoolean(params.get('banned')),
        page: this.parseOptionalInt(params.get('page')),
        pageSize: this.parseOptionalInt(params.get('pageSize')),
      });

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
      return this.toErrorResponse(error);
    }
  }

  static async getUserOverview(_req: NextRequest, userId: string): Promise<NextResponse> {
    try {
      const repository = new DrizzleBackofficeUserRepository();
      const useCase = new GetBackofficeUserOverviewUseCase(repository);
      const overview = await useCase.execute(userId);
      if (!overview) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({
        id: overview.id,
        name: overview.name,
        email: overview.email,
        emailVerified: overview.emailVerified,
        image: overview.image,
        createdAt: overview.createdAt.toISOString(),
        updatedAt: overview.updatedAt.toISOString(),
        lastSeenAt: overview.lastSeenAt ? overview.lastSeenAt.toISOString() : null,

        banned: overview.banned,
        banReason: overview.banReason,
        banSource: overview.banSource,
        bannedAt: overview.bannedAt ? overview.bannedAt.toISOString() : null,

        providers: overview.providers,

        venuesOwnedCount: overview.venuesOwnedCount,
        venuesMemberCount: overview.venuesMemberCount,
        bookingsCount: overview.bookingsCount,
        paymentsCount: overview.paymentsCount,

        recentBookings: overview.recentBookings.map((booking) => ({
          id: booking.id,
          date: booking.date,
          startTime: booking.startTime,
          durationHours: booking.durationHours,
          status: booking.status,
          courtName: booking.courtName,
          venueName: booking.venueName,
        })),

        lastActiveSession: overview.lastActiveSession
          ? {
              ipAddress: overview.lastActiveSession.ipAddress,
              userAgent: overview.lastActiveSession.userAgent,
              updatedAt: overview.lastActiveSession.updatedAt.toISOString(),
            }
          : null,
      });
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  static async listUserVenues(_req: NextRequest, userId: string): Promise<NextResponse> {
    try {
      const repository = new DrizzleBackofficeUserRepository();
      const useCase = new ListBackofficeUserVenuesUseCase(repository);
      const result = await useCase.execute(userId);

      return NextResponse.json({
        owned: result.owned.map((venue) => ({
          id: venue.id,
          name: venue.name,
          cityName: venue.cityName,
          stateUf: venue.stateUf,
          isActive: venue.isActive,
          createdAt: venue.createdAt.toISOString(),
        })),
        member: result.member,
      });
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  static async listUserBookings(req: NextRequest, userId: string): Promise<NextResponse> {
    try {
      const params = req.nextUrl.searchParams;

      const repository = new DrizzleBackofficeUserRepository();
      const useCase = new ListBackofficeUserBookingsUseCase(repository);
      const result = await useCase.execute({
        userId,
        status: params.get('status') ?? undefined,
        from: params.get('from') ?? undefined,
        to: params.get('to') ?? undefined,
        page: this.parseOptionalInt(params.get('page')),
        pageSize: this.parseOptionalInt(params.get('pageSize')),
      });

      return NextResponse.json({
        data: result.items.map((item) => ({
          id: item.id,
          date: item.date,
          startTime: item.startTime,
          durationHours: item.durationHours,
          status: item.status,
          courtId: item.courtId,
          courtName: item.courtName,
          venueId: item.venueId,
          venueName: item.venueName,
          createdAt: item.createdAt.toISOString(),
        })),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      });
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  static async listUserActiveSessions(_req: NextRequest, userId: string): Promise<NextResponse> {
    try {
      const repository = new DrizzleBackofficeUserRepository();
      const useCase = new ListBackofficeUserActiveSessionsUseCase(repository);
      const result = await useCase.execute(userId);

      return NextResponse.json({
        data: result.map((session) => ({
          id: session.id,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
          expiresAt: session.expiresAt.toISOString(),
        })),
      });
    } catch (error) {
      return this.toErrorResponse(error);
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

  private static toErrorResponse(error: unknown): NextResponse {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const isClientError = CLIENT_ERROR_PREFIXES.some((prefix) => message.startsWith(prefix));
    return NextResponse.json({ error: message }, { status: isClientError ? 400 : 500 });
  }
}
