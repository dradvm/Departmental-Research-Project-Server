import { Body, Controller, Headers, Post, Req, Res } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { StripeService } from '../stripe/stripe.service';
import Stripe from 'stripe';
import { Request, Response } from 'express';

@Controller('/test')
export class TestController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly stripeService: StripeService
  ) {}

  @Post('/delete')
  async Test() {
    return this.cloudinaryService.deleteImage('s54ttz3ucuycyebviyzn');
  }

  @Post('create-intent')
  async createPaymentIntent(
    @Body() body: { amount: number; currency?: string }
  ) {
    const { amount, currency } = body;
    const intent = await this.stripeService.createPaymentIntent(
      amount,
      currency
    );
    return { clientSecret: intent.client_secret };
  }
  @Post('webhook')
  handleWebhook(
    @Req() req: Request & { rawBody: Buffer },
    @Res() res: Response,
    @Headers('stripe-signature') signature: string
  ) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      event = Stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret!
      );
    } catch (error) {
      const err = error as Error;
      console.error('❌ Invalid signature.', err.message);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return res.status(500).send(`Webhook Error: ${err.message}`);
    }

    // ✅ Nếu hợp lệ, xử lý theo loại sự kiện
    let paymentIntent;
    switch (event.type) {
      case 'payment_intent.succeeded':
        paymentIntent = event.data.object;
        console.log(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        return res.status(500);

      default:
    }

    return res.status(200).json({ received: true });
  }
}
