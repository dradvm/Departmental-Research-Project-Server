import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';
import { CourseModule } from './modules/course/course.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { TestController } from './modules/test/test.controller';
import { StripeModule } from './modules/stripe/stripe.module';
import { UsersModule } from './modules/user/users.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PaymentDetailModule } from './modules/payment_detail/paymentdetail.module';
import { CartModule } from './modules/cart/cart.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { CouponCourseModule } from './modules/coupon_course/couponcourse.module';
import { UserCouponModule } from './modules/user_coupon/usecoupon.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    PrismaModule,
    CourseModule,
    PaymentModule,
    PaymentDetailModule,
    CartModule,
    CouponModule,
    CouponCourseModule,
    UserCouponModule,
    CloudinaryModule,
    StripeModule.forRootAsync(),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
              namespace: 'nestjs-memory-cache'
            }),
            createKeyv('redis://localhost:6379/1', {
              namespace: 'nestjs_newbie'
            })
          ]
        };
      }
    })
  ],
  controllers: [AppController, TestController],
  providers: [AppService]
})
export class AppModule {}
