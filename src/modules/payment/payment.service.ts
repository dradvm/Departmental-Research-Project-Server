import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentCreateDto } from './dto/create-payment';
import { Payment } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async addOnePayment(data: PaymentCreateDto): Promise<Payment | null> {
    try {
      data.timePayment = new Date().toISOString();
      return await this.prisma.payment.create({ data });
    } catch (e) {
      throw new BadRequestException(`
        Can not create a payment: ${e}
      `);
    }
  }

  async getAllPayment(userId?: number): Promise<any[]> {
    try {
      const data = await this.prisma.payment.findMany({
        where: userId ? { userId } : {},
        include: {
          PaymentDetail: {
            include: {
              Course: true
            }
          },
          User: true
        }
      });
      const result = data.map((da) => {
        return {
          paymentId: da.paymentId,
          timePayment: da.timePayment,
          totalPrice: da.totalPrice,
          userId: da.userId,
          userName: da.User?.name,
          courseAmount: da.PaymentDetail.length,
          PaymentDetail: da.PaymentDetail.map((pay) => ({
            courseId: pay.courseId,
            price: pay.price,
            originalPrice: pay.Course.price,
            courseTitle: pay.Course.title,
            courseThumbnail: pay.Course.thumbnail
          }))
        };
      });
      return result;
    } catch (e) {
      throw new BadRequestException(`Can not get all payment: ${e}`);
    }
  }

  async getPaymentCountAndCost(userId?: number): Promise<{
    totalPrice: number;
    paymentCount: number;
  }> {
    const data = await this.prisma.payment.aggregate({
      where: userId ? { userId } : {},
      _sum: { totalPrice: true },
      _count: true
    });
    return {
      totalPrice: Number(data._sum.totalPrice ?? 0),
      paymentCount: data._count
    };
  }
}
