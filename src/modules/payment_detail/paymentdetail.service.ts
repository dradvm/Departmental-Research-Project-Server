import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentDetailService {
  constructor(private prisma: PrismaService) {}

  // calculate total price and final price of a payment with its ID
  async getTotalPriceOfOnePayment(
    paymentId: number,
    tx?: Prisma.TransactionClient
  ): Promise<{ originalPrice: Decimal; totalPrice: Decimal }> {
    try {
      if (!paymentId) throw new BadRequestException(`paymentId is required!`);
      const client = tx ?? this.prisma;
      const figure = await client.paymentDetail.aggregate({
        where: { paymentId: paymentId },
        _sum: { price: true, final_price: true }
      });
      return {
        originalPrice: figure._sum?.price ?? new Decimal(0),
        totalPrice: figure._sum?.final_price ?? new Decimal(0)
      };
    } catch (e) {
      throw new BadRequestException(`
      Can not get total price of payment ${paymentId}: ${e}  
      `);
    }
  }
}
