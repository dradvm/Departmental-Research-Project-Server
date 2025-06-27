import { forwardRef, Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CouponCourseModule } from '../coupon_course/couponcourse.module';
import { PaymentModule } from '../payment/payment.module';
import { CouponModule } from '../coupon/coupon.module';

@Module({
  imports: [
    PrismaModule,
    CouponCourseModule,
    CouponModule,
    forwardRef(() => PaymentModule)
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService]
})
export class CartModule {}
