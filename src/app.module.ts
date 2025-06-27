import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
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
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/passport/jwt-auth.guard';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
// import { TransformInterceptor } from './core/transform.interceptor';
import { StudyProgressModule } from './modules/study-progress/study-progress.module';
import { EnrollmentModule } from './modules/enrollment/enrollment.module';
import { NoteModule } from './modules/note/note.module';
import { PaymentTransacyionModule } from './modules/payment_transaction/paymenttransaction.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ConfigModule,
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
    PaymentTransacyionModule,
    CloudinaryModule,
    StudyProgressModule,
    EnrollmentModule,
    NoteModule,
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
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          // ignoreTLS: true,
          // secure: false,
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASS')
          }
        },
        defaults: {
          from: '"No Reply" <no-reply@localhost>'
        },
        // preview: true,
        template: {
          dir: process.cwd() + '/src/mail/templates/',
          adapter: new HandlebarsAdapter(), // or new PugAdapter() or new EjsAdapter()
          options: {
            strict: true
          }
        }
      }),
      inject: [ConfigService]
    })
  ],
  controllers: [AppController, TestController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    }
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: TransformInterceptor,
    // },
  ]
})
export class AppModule {}
