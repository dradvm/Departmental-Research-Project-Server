import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaymentService } from '../payment/payment.service';

@Module({
  imports: [PrismaModule],
  controllers: [CartController],
  providers: [CartService, PaymentService],
  exports: [CartService]
})
export class CartModule {}
