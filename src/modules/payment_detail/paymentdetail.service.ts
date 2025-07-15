import { BadRequestException, Injectable } from '@nestjs/common';
import { Course, Prisma } from '@prisma/client';
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

  async getBestSellerCourse() {
    const data = await this.prisma.paymentDetail.groupBy({
      by: ['courseId'],
      _count: {
        couponId: true
      },
      _sum: {
        final_price: true
      },
      orderBy: {
        _count: {
          couponId: 'desc'
        }
      }
    });
    const result = [];
    const dataLen: number = data.length;
    for (let i = 0; i < dataLen; i++) {
      const courseInfor: Course | null = await this.prisma.course.findUnique({
        where: {
          courseId: data[i].courseId
        }
      });
      result.push({
        title: courseInfor ? courseInfor.title : 'Không xác định',
        count: data[i]._count.couponId,
        revenue: Number(data[i]._sum.final_price)
      });
    }
    return result.length > 10 ? result.slice(0, 10) : result;
  }
}
