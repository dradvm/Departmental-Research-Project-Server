import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CouponController } from './modules/coupon/coupon.controller';
import { AppService } from './app.service';
import { CouponService } from './modules/coupon/coupon.service';
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

@Module({
  imports: [
    UsersModule,
    AuthModule,
    PrismaModule,
    CourseModule,
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
  controllers: [AppController, CouponController, TestController],
  providers: [AppService, CouponService]
})
export class AppModule {}
