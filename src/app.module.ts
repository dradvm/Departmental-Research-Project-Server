import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CouponController } from './coupon/coupon.controller';
import { AppService } from './app.service';
import { CouponService } from './coupon/coupon.service';
import { PrismaModule } from './prisma/prisma.module';
@Module({
  imports: [PrismaModule],
  controllers: [AppController, CouponController],
  providers: [AppService, CouponService],
})
export class AppModule {}
