import {
  EmailSender,
  SendEmailInput,
  SendEmailResult,
} from '@/domain/email/service/email-sender.interface';

export class SendEmailUseCase {
  constructor(private readonly emailSender: EmailSender) {}

  async execute(input: SendEmailInput): Promise<SendEmailResult> {
    return this.emailSender.sendEmail(input);
  }
}
