import { forwardRef, Module } from '@nestjs/common';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CouponCourseModule } from '../coupon_course/couponcourse.module';

@Module({
  imports: [PrismaModule, forwardRef(() => CouponCourseModule)],
  controllers: [CouponController],
  providers: [CouponService],
  exports: [CouponService]
})
export class CouponModule {}
