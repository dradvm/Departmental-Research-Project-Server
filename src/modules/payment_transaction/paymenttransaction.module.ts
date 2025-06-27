import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StripeModule } from '../stripe/stripe.module';
import { PaymentTransactionController } from './paymenttransaction.controller';
import { PaymentTransactionService } from './paymenttransaction.service';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [PrismaModule, StripeModule.forRootAsync()],
  controllers: [PaymentTransactionController, WebhookController],
  providers: [PaymentTransactionService],
  exports: [PaymentTransactionService]
})
export class PaymentTransacyionModule {}
