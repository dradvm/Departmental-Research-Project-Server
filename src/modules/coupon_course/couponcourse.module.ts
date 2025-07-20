import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CouponCourseController } from './couponcourse.controller';
import { CouponCourseService } from './couponcourse.service';
import { CouponModule } from '../coupon/coupon.module';

@Module({
  imports: [PrismaModule, forwardRef(() => CouponModule)],
  controllers: [CouponCourseController],
  providers: [CouponCourseService],
  exports: [CouponCourseService]
})
export class CouponCourseModule {}
