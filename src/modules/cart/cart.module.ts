import { forwardRef, Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CouponCourseModule } from '../coupon_course/couponcourse.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [PrismaModule, CouponCourseModule, forwardRef(() => PaymentModule)],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService]
})
export class CartModule {}
