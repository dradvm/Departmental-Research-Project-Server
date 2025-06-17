import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentDetail } from '@prisma/client';
import { PaymentDetailCreateDto } from './dto/create-paymentdetail';

@Injectable()
export class PaymentDetailService {
  constructor(private prisma: PrismaService) {}

  async addCourseIntoCart(
    data: PaymentDetailCreateDto
  ): Promise<PaymentDetail> {
    try {
      const paymentDetail = await this.prisma.paymentDetail.create({ data });
      return paymentDetail;
    } catch (e) {
      throw new BadRequestException(`Can not add item into cart: ${e}`);
    }
  }
}
