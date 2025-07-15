import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { PaymentCreateDto, PaymentIntentCreateDto } from './dto/create-payment';
import { Payment } from '@prisma/client';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { ApiRequestData } from 'src/common/base/api.request';
import { StripeService } from '../stripe/stripe.service';
import { Decimal } from '@prisma/client/runtime/library';
import { PaymentOutputRespone } from './dto/output-payment';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly stripeService: StripeService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post('/create-intent')
  async createPaymentTransaction(
    @Req() req: ApiRequestData,
    @Body() body: PaymentIntentCreateDto
  ): Promise<{ clientSecret: string }> {
    const userId: number = req.user.userId;
    return await this.stripeService.createTransactionIntent(
      body.amount,
      userId
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPayment(
    @Req() req: ApiRequestData,
    @Body() data: PaymentCreateDto
  ): Promise<Payment | null> {
    return await this.paymentService.addOnePayment(data, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/my-transaction')
  async getAllUserPayment(
    @Req() req: ApiRequestData,
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('userName') userName?: string
  ): Promise<PaymentOutputRespone> {
    return await this.paymentService.getAllPayment(
      parseInt(limit),
      parseInt(skip),
      req.user.userId,
      startDate || undefined,
      endDate || undefined,
      minPrice ? new Decimal(minPrice) : undefined,
      maxPrice ? new Decimal(maxPrice) : undefined,
      userName || undefined
    );
  }

  // admin feature
  @Get()
  async getAllPayment(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('userName') userName?: string
  ): Promise<PaymentOutputRespone> {
    return await this.paymentService.getAllPayment(
      parseInt(limit),
      parseInt(skip),
      userId ? parseInt(userId) : undefined,
      startDate || undefined,
      endDate || undefined,
      minPrice ? new Decimal(minPrice) : undefined,
      maxPrice ? new Decimal(maxPrice) : undefined,
      userName || undefined
    );
  }
}
