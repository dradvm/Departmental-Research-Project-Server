import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';

@Module({})
export class StripeModule {
  static forRootAsync(): DynamicModule {
    return {
      module: StripeModule,
      imports: [ConfigModule.forRoot()],
      providers: [
        StripeService,
        {
          provide: 'STRIPE_API_KEY',
          useFactory: (configService: ConfigService) =>
            configService.get<string>('STRIPE_API_KEY'),
          inject: [ConfigService]
        }
      ],
      exports: [StripeService]
    };
  }
}
