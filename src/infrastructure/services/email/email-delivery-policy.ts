export interface EmailDeliveryEnv {
  NODE_ENV?: string;
  EMAIL_DELIVERY_ENABLED?: string;
}

export class EmailDeliveryPolicy {
  constructor(private readonly env: EmailDeliveryEnv = process.env) {}

  shouldDeliver(): boolean {
    if (this.env.EMAIL_DELIVERY_ENABLED === 'true') return true;
    if (this.env.NODE_ENV === 'production') return true;
    return false;
  }
}
