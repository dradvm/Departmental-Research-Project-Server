import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaymentDetailService } from './paymentdetail.service';
import { CouponCourseModule } from '../coupon_course/couponcourse.module';

@Module({
  imports: [PrismaModule, CouponCourseModule],
  controllers: [],
  providers: [PaymentDetailService],
  exports: [PaymentDetailService]
})
export class PaymentDetailModule {}
