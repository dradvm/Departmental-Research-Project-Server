import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { PaymentCreateDto } from './dto/create-payment';
import { Payment } from '@prisma/client';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPayment(
    @Req() req: AuthenticatedRequest,
    @Body() data: PaymentCreateDto
  ): Promise<Payment | null> {
    return await this.paymentService.addOnePayment(data, req.user.userId);
  }

  @Get()
  async getAllPayment(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('userId') userId?: string
  ): Promise<any[]> {
    return await this.paymentService.getAllPayment(
      parseInt(limit),
      parseInt(skip),
      userId ? parseInt(userId) : undefined
    );
  }
}
