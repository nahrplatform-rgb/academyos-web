// Payment adapter interface — common interface for Paymob and Whop.
// AcademyOS calls this interface; the adapter routes to the correct provider.

export interface PaymentAdapter {
  /** Create a payment for an invoice. Returns provider payment ID and redirect URL. */
  createPayment(input: {
    invoiceId: string;
    amount: number;
    currency: string;
    academyId: string;
    description: string;
  }): Promise<{ providerPaymentId: string; redirectUrl: string | null }>;

  /** Get payment status from provider. */
  getPaymentStatus(providerPaymentId: string): Promise<{
    status: 'pending' | 'paid' | 'failed' | 'refunded' | 'disputed';
    amount: number;
    currency: string;
    paidAt: string | null;
    providerReference: string;
  }>;

  /** Process a refund. */
  refund(input: {
    providerPaymentId: string;
    amount: number;
    reason: string;
  }): Promise<{ refundId: string; status: string }>;

  /** Verify webhook signature. */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;

  /** Parse webhook payload into a normalized event. */
  parseWebhook(payload: unknown): {
    eventType: 'payment_success' | 'payment_failed' | 'subscription_cancelled' | 'refund_issued' | 'chargeback';
    providerPaymentId: string;
    invoiceId: string | null;
    amount: number;
    currency: string;
    timestamp: string;
    providerReference: string;
  } | null;
}

export type PaymentProvider = 'paymob' | 'whop';

export function getPaymentAdapter(provider: PaymentProvider): PaymentAdapter {
  switch (provider) {
    case 'paymob':
      return new PaymobAdapter();
    case 'whop':
      return new WhopAdapter();
    default:
      throw new Error(`Unknown payment provider: ${provider}`);
  }
}

// Paymob adapter (Egypt)
class PaymobAdapter implements PaymentAdapter {
  async createPayment(): Promise<{ providerPaymentId: string; redirectUrl: string | null }> {
    // TODO: Implement Paymob integration
    // 1. Create Paymob order
    // 2. Create payment key
    // 3. Return payment ID and redirect URL
    throw new Error('Paymob adapter not yet implemented');
  }

  async getPaymentStatus(): Promise<{
    status: 'pending' | 'paid' | 'failed' | 'refunded' | 'disputed';
    amount: number;
    currency: string;
    paidAt: string | null;
    providerReference: string;
  }> {
    throw new Error('Paymob adapter not yet implemented');
  }

  async refund(): Promise<{ refundId: string; status: string }> {
    throw new Error('Paymob adapter not yet implemented');
  }

  verifyWebhookSignature(): boolean {
    // Paymob uses HMAC-SHA512 with the secret
    // Implementation: compute HMAC-SHA512(payload, secret) and compare with signature
    return false; // TODO: Implement
  }

  parseWebhook(): {
    eventType: 'payment_success' | 'payment_failed' | 'subscription_cancelled' | 'refund_issued' | 'chargeback';
    providerPaymentId: string;
    invoiceId: string | null;
    amount: number;
    currency: string;
    timestamp: string;
    providerReference: string;
  } | null {
    // TODO: Implement Paymob webhook parsing
    return null;
  }
}

// Whop adapter (International)
class WhopAdapter implements PaymentAdapter {
  async createPayment(): Promise<{ providerPaymentId: string; redirectUrl: string | null }> {
    // TODO: Implement Whop integration
    // 1. Create Whop checkout session
    // 2. Return session ID and redirect URL
    throw new Error('Whop adapter not yet implemented');
  }

  async getPaymentStatus(): Promise<{
    status: 'pending' | 'paid' | 'failed' | 'refunded' | 'disputed';
    amount: number;
    currency: string;
    paidAt: string | null;
    providerReference: string;
  }> {
    throw new Error('Whop adapter not yet implemented');
  }

  async refund(): Promise<{ refundId: string; status: string }> {
    throw new Error('Whop adapter not yet implemented');
  }

  verifyWebhookSignature(): boolean {
    // Whop uses HMAC-SHA256 with the secret
    // Implementation: compute HMAC-SHA256(payload, secret) and compare with signature
    return false; // TODO: Implement
  }

  parseWebhook(): {
    eventType: 'payment_success' | 'payment_failed' | 'subscription_cancelled' | 'refund_issued' | 'chargeback';
    providerPaymentId: string;
    invoiceId: string | null;
    amount: number;
    currency: string;
    timestamp: string;
    providerReference: string;
  } | null {
    // TODO: Implement Whop webhook parsing
    return null;
  }
}
