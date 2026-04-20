import { BanSource } from '@/domain/user/entity/ban-source';
import {
  BackofficeUserRepositoryInterface,
} from '@/domain/user/repository/backoffice-user-repository.interface';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const REASON_MIN_LENGTH = 10;
const REASON_MAX_LENGTH = 500;

export type IsStaffEmail = (email: string) => boolean;

export interface BanUserFromBackofficeInput {
  userId: string;
  actorId: string;
  reason: string;
}

export interface BanUserFromBackofficeResult {
  id: string;
  banned: true;
  banReason: string;
  banSource: BanSource;
  bannedAt: Date;
  revokedSessions: number;
}

export class TargetUserNotFoundError extends Error {
  constructor() {
    super('Not found: target user does not exist');
    this.name = 'TargetUserNotFoundError';
  }
}

export class CannotBanStaffError extends Error {
  constructor() {
    super('Cannot ban a staff member');
    this.name = 'CannotBanStaffError';
  }
}

export class CannotBanSelfError extends Error {
  constructor() {
    super('Cannot ban yourself');
    this.name = 'CannotBanSelfError';
  }
}

export class BanUserFromBackofficeUseCase {
  constructor(
    private readonly repository: BackofficeUserRepositoryInterface,
    private readonly isStaffEmail: IsStaffEmail,
  ) {}

  async execute(input: BanUserFromBackofficeInput): Promise<BanUserFromBackofficeResult> {
    const { userId, actorId, reason } = this.parseInput(input);

    if (userId === actorId) {
      throw new CannotBanSelfError();
    }

    const target = await this.repository.findBanTargetById(userId);
    if (!target) {
      throw new TargetUserNotFoundError();
    }

    if (this.isStaffEmail(target.email)) {
      throw new CannotBanStaffError();
    }

    const banState = await this.repository.banUser(userId, {
      reason,
      source: BanSource.STAFF,
    });

    const revokedSessions = await this.repository.deleteSessionsOfUser(userId);

    return {
      id: banState.id,
      banned: true,
      banReason: banState.banReason ?? reason,
      banSource: banState.banSource ?? BanSource.STAFF,
      bannedAt: banState.bannedAt ?? new Date(),
      revokedSessions,
    };
  }

  private parseInput(input: BanUserFromBackofficeInput) {
    if (!input.userId || !UUID_REGEX.test(input.userId)) {
      throw new Error('Invalid id: expected a UUID');
    }
    if (!input.actorId || !UUID_REGEX.test(input.actorId)) {
      throw new Error('Invalid actorId: expected a UUID');
    }

    const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
    if (reason.length < REASON_MIN_LENGTH || reason.length > REASON_MAX_LENGTH) {
      throw new Error(
        `Invalid reason: must be between ${REASON_MIN_LENGTH} and ${REASON_MAX_LENGTH} characters`,
      );
    }

    return { userId: input.userId, actorId: input.actorId, reason };
  }
}
