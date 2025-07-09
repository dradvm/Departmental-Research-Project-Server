import { Module } from '@nestjs/common';
import { OverviewController } from './overview.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaymentModule } from '../payment/payment.module';
import { PaymentDetailModule } from '../payment_detail/paymentdetail.module';

@Module({
  imports: [PrismaModule, PaymentModule, PaymentDetailModule],
  controllers: [OverviewController]
})
export class OverviewModule {}
