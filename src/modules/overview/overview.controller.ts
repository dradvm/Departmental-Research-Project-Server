import { Controller, Get } from '@nestjs/common';
import { PaymentService } from '../payment/payment.service';
import { PaymentDetailService } from '../payment_detail/paymentdetail.service';

@Controller('overview')
export class OverviewController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly paymentDetailService: PaymentDetailService
  ) {}

  @Get('/revenue-by-month')
  async getRevenueByMonth() {
    return await this.paymentService.getRevenueByMonths();
  }
  @Get('/best-seller-course')
  async getBestSellerCourse() {
    return await this.paymentDetailService.getBestSellerCourse();
  }
}
