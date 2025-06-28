import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(@Inject('STRIPE_API_KEY') private readonly apiKey: string) {
    this.stripe = new Stripe(this.apiKey, {
      apiVersion: '2025-05-28.basil'
    });
  }

  async createTransactionIntent(
    amount: number,
    userId: number
  ): Promise<{ clientSecret: string }> {
    const intent = await this.stripe.paymentIntents.create({
      amount: amount,
      currency: 'vnd',
      automatic_payment_methods: { enabled: true },
      metadata: { userId: userId.toString() }
    });

    if (!intent.client_secret)
      throw new BadRequestException(`Can not create intent.client_secret`);

    return { clientSecret: intent.client_secret };
  }
}
