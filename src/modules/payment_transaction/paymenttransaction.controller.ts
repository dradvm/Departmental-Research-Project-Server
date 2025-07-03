import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';
import { StripeService } from '../stripe/stripe.service';
import { PaymentTransactionCreateDto } from './dto/create-paymenttransaction';

@Controller('paymenttransaction')
export class PaymentTransactionController {
  constructor(private readonly stripeService: StripeService) { }

  @UseGuards(JwtAuthGuard)
  @Post('/create-intent')
  async createPaymentTransaction(
    @Req() req: AuthenticatedRequest,
    @Body() body: PaymentTransactionCreateDto
  ): Promise<{ clientSecret: string }> {
    console.log(`Số tiền cần thanh toán: ${body.amount}`);
    const userId: number = req.user.userId;
    return await this.stripeService.createTransactionIntent(
      body.amount,
      userId
    );
  }
}
