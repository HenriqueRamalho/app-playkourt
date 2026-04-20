import {
  BackofficeUserOverview,
  BackofficeUserRepositoryInterface,
} from '@/domain/user/repository/backoffice-user-repository.interface';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class GetBackofficeUserOverviewUseCase {
  constructor(private readonly repository: BackofficeUserRepositoryInterface) {}

  async execute(userId: string): Promise<BackofficeUserOverview | null> {
    if (!userId || !UUID_REGEX.test(userId)) {
      throw new Error('Invalid id: expected a UUID');
    }
    return this.repository.findOverviewById(userId);
  }
}
