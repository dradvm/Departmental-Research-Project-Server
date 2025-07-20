import { Controller, Get, UseGuards } from '@nestjs/common';
import { PaymentService } from '../payment/payment.service';
import { PaymentDetailService } from '../payment_detail/paymentdetail.service';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/decorator/role.decorator';

@Controller('overview')
export class OverviewController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly paymentDetailService: PaymentDetailService
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('/revenue-by-month')
  async getRevenueByMonth() {
    return await this.paymentService.getRevenueByMonths();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('/best-seller-course')
  async getBestSellerCourse() {
    return await this.paymentDetailService.getBestSellerCourse();
  }
}
