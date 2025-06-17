import { Body, Controller, Post } from '@nestjs/common';
import { PaymentDetailService } from './paymentdetail.service';
import { PaymentDetailCreateDto } from './dto/create-paymentdetail';
import { PaymentDetail } from '@prisma/client';

@Controller('paymentdetail')
export class PaymentDetailController {
  constructor(private readonly paymentDetailService: PaymentDetailService) {}

  @Post()
  async addCourse(
    @Body() data: PaymentDetailCreateDto
  ): Promise<PaymentDetail> {
    const payment = await this.paymentDetailService.addCourseIntoCart(data);
    return payment;
  }
}
