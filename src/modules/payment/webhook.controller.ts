import { Controller, Headers, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { Public } from 'src/decorator/customize';
import Stripe from 'stripe';

@Public()
@Controller('webhook')
export class WebhookController {
  @Post('/stripe')
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
      console.error('Invalid signature.', err.message);
      return res.status(500).send(`Webhook Error: ${err.message}`);
    }

    // let paymentIntent;
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log(`Thanh toán thành công`);
        // paymentIntent = event.data.object;
        // console.log(`=====Thông tin thanh toán=====`);
        // console.log(paymentIntent);
        // console.log(`=====Kết thúc thông tin thanh toán=====`);
        break;

      case 'payment_intent.payment_failed':
        console.log('Thanh toán thất bại!');
        break;
    }

    return res.status(200).json({ received: true });
  }
}
