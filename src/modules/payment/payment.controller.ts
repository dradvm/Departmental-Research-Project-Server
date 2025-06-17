import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PaymentCreateDto } from './dto/create-payment';
import { Payment } from '@prisma/client';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async createPayment(@Body() data: PaymentCreateDto): Promise<Payment | null> {
    return await this.paymentService.addOnePayment(data);
  }

  @Get()
  async getAllPayment(@Query('userId') userId?: string): Promise<any[]> {
    return await this.paymentService.getAllPayment(
      userId ? parseInt(userId) : undefined
    );
  }

  @Get('/count-and-totalPrice')
  async getPaymentCountAndTotalPrice(
    @Query('userId') userId?: string
  ): Promise<any> {
    return await this.paymentService.getPaymentCountAndCost(
      userId ? parseInt(userId) : undefined
    );
  }
}
