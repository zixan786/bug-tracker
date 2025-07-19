// Stripe service temporarily disabled for demo
export class StripeService {
  static async createCheckoutSession(): Promise<any> {
    throw new Error("Stripe service not implemented");
  }

  static async handleWebhook(): Promise<void> {
    throw new Error("Stripe service not implemented");
  }
}
