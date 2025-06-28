import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentDetailModule } from '../payment_detail/paymentdetail.module';
import { CouponCourseModule } from '../coupon_course/couponcourse.module';
import { CouponModule } from '../coupon/coupon.module';
import { CartModule } from '../cart/cart.module';
import { StripeModule } from '../stripe/stripe.module';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [
    PrismaModule,
    PaymentDetailModule,
    CouponCourseModule,
    CouponModule,
    forwardRef(() => CartModule),
    StripeModule.forRootAsync()
  ],
  controllers: [PaymentController, WebhookController],
  providers: [PaymentService],
  exports: [PaymentService]
})
export class PaymentModule {}
