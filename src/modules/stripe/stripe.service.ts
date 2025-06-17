import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(@Inject('STRIPE_API_KEY') private readonly apiKey: string) {
    this.stripe = new Stripe(this.apiKey, {
      apiVersion: '2025-05-28.basil'
    });
  }

  async createPaymentIntent(amount: number, currency = 'usd') {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        automatic_payment_methods: {
          enabled: true
        }
      });
      return paymentIntent;
    } catch (error) {
      throw new Error('Payment creation failed: ', error);
    }
  }
}
