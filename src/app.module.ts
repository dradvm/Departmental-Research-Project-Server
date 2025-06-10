import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CouponController } from './coupon/coupon.controller';
import { AppService } from './app.service';
import { CouponService } from './coupon/coupon.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
              namespace: 'nestjs-memory-cache',
            }),
            createKeyv('redis://localhost:6379/1', {
              namespace: 'nestjs_newbie',
            }),
          ],
        };
      }
    }),
  ],
  controllers: [AppController, CouponController],
  providers: [AppService, CouponService]
})
export class AppModule { }
