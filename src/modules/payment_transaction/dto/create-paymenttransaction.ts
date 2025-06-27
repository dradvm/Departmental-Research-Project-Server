import { IsNumber } from 'class-validator';

export class PaymentTransactionCreateDto {
  @IsNumber()
  amount: number;
}
