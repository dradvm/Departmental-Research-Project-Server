import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserCouponController } from './usercoupon.controller';
import { UserCouponService } from './usercoupon.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserCouponController],
  providers: [UserCouponService],
  exports: [UserCouponService]
})
export class UserCouponModule {}
