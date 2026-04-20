import {
  BackofficeUserRepositoryInterface,
} from '@/domain/user/repository/backoffice-user-repository.interface';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface UnbanUserFromBackofficeInput {
  userId: string;
  actorId: string;
}

export interface UnbanUserFromBackofficeResult {
  id: string;
  banned: false;
  banReason: null;
  banSource: null;
  bannedAt: null;
}

export class UnbanTargetNotFoundError extends Error {
  constructor() {
    super('Not found: target user does not exist');
    this.name = 'UnbanTargetNotFoundError';
  }
}

export class UnbanUserFromBackofficeUseCase {
  constructor(private readonly repository: BackofficeUserRepositoryInterface) {}

  async execute(input: UnbanUserFromBackofficeInput): Promise<UnbanUserFromBackofficeResult> {
    this.parseInput(input);

    const target = await this.repository.findBanTargetById(input.userId);
    if (!target) {
      throw new UnbanTargetNotFoundError();
    }

    if (!target.banned) {
      return {
        id: target.id,
        banned: false,
        banReason: null,
        banSource: null,
        bannedAt: null,
      };
    }

    const state = await this.repository.unbanUser(input.userId);
    return {
      id: state.id,
      banned: false,
      banReason: null,
      banSource: null,
      bannedAt: null,
    };
  }

  private parseInput(input: UnbanUserFromBackofficeInput): void {
    if (!input.userId || !UUID_REGEX.test(input.userId)) {
      throw new Error('Invalid id: expected a UUID');
    }
    if (!input.actorId || !UUID_REGEX.test(input.actorId)) {
      throw new Error('Invalid actorId: expected a UUID');
    }
  }
}
