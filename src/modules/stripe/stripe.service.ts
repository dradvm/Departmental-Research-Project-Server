import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PaymentTransaction } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    @Inject('STRIPE_API_KEY') private readonly apiKey: string,
    private prisma: PrismaService
  ) {
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

    // store into database
    await this.prisma.paymentTransaction.create({
      data: {
        provider: 'stripe',
        providerRef: intent.id,
        status: 'pending',
        amount: amount,
        method: 'stripe_auto',
        userId: userId
      }
    });

    return { clientSecret: intent.client_secret };
  }

  async handleSuccessfulPayment(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<PaymentTransaction> {
    return await this.prisma.paymentTransaction.update({
      where: {
        provider: 'stripe',
        providerRef: paymentIntent.id,
        status: 'pending'
      },
      data: {
        status: 'succeeded'
      }
    });
  }
}
