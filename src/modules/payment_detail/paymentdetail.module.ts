import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaymentDetailController } from './paymentdetail.controller';
import { PaymentDetailService } from './paymentdetail.service';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentDetailController],
  providers: [PaymentDetailService],
  exports: [PaymentDetailService]
})
export class PaymentDetailModule {}
