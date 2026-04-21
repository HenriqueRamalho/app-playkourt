import {
  ProcessedEmailDetail,
  ProcessedEmailRepositoryInterface,
} from '@/domain/email/repository/processed-email-repository.interface';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class GetProcessedEmailForBackofficeUseCase {
  constructor(private readonly repository: ProcessedEmailRepositoryInterface) {}

  async execute(id: string): Promise<ProcessedEmailDetail | null> {
    const trimmed = id?.trim();
    if (!trimmed || !UUID_REGEX.test(trimmed)) {
      throw new Error('Invalid id: expected a UUID');
    }
    return this.repository.findById(trimmed);
  }
}
