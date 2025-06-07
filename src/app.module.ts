import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CouponController } from './coupon/coupon.controller';
import { AppService } from './app.service';
import { CouponService } from './coupon/coupon.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AppController, CouponController],
  providers: [AppService, CouponService]
})
export class AppModule {}
