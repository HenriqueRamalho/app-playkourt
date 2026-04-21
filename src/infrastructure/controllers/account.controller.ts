import { NextRequest, NextResponse } from 'next/server';
import { ChangePasswordUseCase } from '@/application/use-cases/user/ChangePasswordUseCase';
import { GetAccountSecurityStatusUseCase } from '@/application/use-cases/user/GetAccountSecurityStatusUseCase';
import { SetInitialPasswordUseCase } from '@/application/use-cases/user/SetInitialPasswordUseCase';
import { UpdateUserNameUseCase } from '@/application/use-cases/user/UpdateUserNameUseCase';
import { applyBetterAuthSetCookieHeaders } from '@/infrastructure/auth/apply-better-auth-set-cookie-headers';
import { BetterAuthUserPasswordService } from '@/infrastructure/auth/better-auth-user-password.service';
import type { AuthUser } from '@/infrastructure/frontend-services/auth/auth.service';
import { DrizzleUserRepository } from '@/infrastructure/repositories/drizzle/drizzle-user.repository';

export class AccountController {
  static async updateProfile(req: NextRequest, user: { id: string; email: string }): Promise<NextResponse> {
    try {
      const { name } = await req.json();
      const userRepository = new DrizzleUserRepository();
      const useCase = new UpdateUserNameUseCase(userRepository);
      const updated = await useCase.execute(user.id, name);
      return NextResponse.json({ id: updated.id, email: updated.email, name: updated.name });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  static async getSecurityStatus(_req: NextRequest, user: AuthUser): Promise<NextResponse> {
    const userRepository = new DrizzleUserRepository();
    const useCase = new GetAccountSecurityStatusUseCase(userRepository);
    const status = await useCase.execute(user.id);
    return NextResponse.json(status);
  }

  static async changePassword(req: NextRequest, user: AuthUser): Promise<NextResponse> {
    try {
      const body = (await req.json()) as Record<string, unknown>;
      const currentPassword = String(body.currentPassword ?? '');
      const newPassword = String(body.newPassword ?? '');
      const confirmNewPassword = String(body.confirmNewPassword ?? '');
      const revokeOtherSessions = body.revokeOtherSessions !== false;

      const userRepository = new DrizzleUserRepository();
      const passwordService = new BetterAuthUserPasswordService();
      const useCase = new ChangePasswordUseCase(userRepository, passwordService);

      const result = await useCase.execute(
        user.id,
        {
          currentPassword,
          newPassword,
          confirmNewPassword,
          revokeOtherSessions,
        },
        req.headers,
      );

      await applyBetterAuthSetCookieHeaders(result.responseHeaders);
      return NextResponse.json({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  static async setInitialPassword(req: NextRequest, user: AuthUser): Promise<NextResponse> {
    try {
      const body = (await req.json()) as Record<string, unknown>;
      const newPassword = String(body.newPassword ?? '');
      const confirmNewPassword = String(body.confirmNewPassword ?? '');

      const userRepository = new DrizzleUserRepository();
      const passwordService = new BetterAuthUserPasswordService();
      const useCase = new SetInitialPasswordUseCase(userRepository, passwordService);

      const result = await useCase.execute(
        user.id,
        { newPassword, confirmNewPassword },
        req.headers,
      );

      await applyBetterAuthSetCookieHeaders(result.responseHeaders);
      return NextResponse.json({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }
}
