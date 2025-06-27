import { Body, Controller, Headers, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { Public } from 'src/decorator/customize';
import Stripe from 'stripe';
import { StripeService } from '../stripe/stripe.service';

@Public()
@Controller('webhook')
export class WebhookController {
  constructor(private readonly stripeService: StripeService) {}
  @Post('/stripe')
  async handleWebhook(
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
      console.error('Invalid signature.', err.message);
      return res.status(500).send(`Webhook Error: ${err.message}`);
    }

    let paymentIntent;
    switch (event.type) {
      case 'payment_intent.succeeded':
        paymentIntent = event.data.object;
        console.log(paymentIntent);
        console.log(`Đã thanh toán thành công rồi. Gọi service xử lý nè`);
        await this.stripeService.handleSuccessfulPayment(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        // return res.status(500);
        console.log('Thanh toán thất bại rồi nha cu');
        break;

      case 'payment_intent.canceled':
        console.log('Bị hủy thủ công hoặc hết thời gian nha mậy');
        break;
      default:
    }

    return res.status(200).json({ received: true });
  }
}
