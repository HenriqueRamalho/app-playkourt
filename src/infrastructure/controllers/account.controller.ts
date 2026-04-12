import { NextRequest, NextResponse } from 'next/server';
import { UpdateUserNameUseCase } from '@/application/use-cases/user/UpdateUserNameUseCase';
import { SupabaseUserRepository } from '@/infrastructure/repositories/supabase/supabase-user.repository';

export class AccountController {
  static async updateProfile(req: NextRequest, user: { id: string; email: string }): Promise<NextResponse> {
    try {
      const { name } = await req.json();
      const userRepository = new SupabaseUserRepository();
      const useCase = new UpdateUserNameUseCase(userRepository);
      const updated = await useCase.execute(user.id, name);
      return NextResponse.json({ id: updated.id, email: updated.email, name: updated.name });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }
}
