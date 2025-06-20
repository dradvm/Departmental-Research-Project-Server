import { IsDateString, IsNumber, IsOptional } from 'class-validator';

export class PaymentCreateDto {
  @IsNumber()
  totalPrice: number;

  @IsNumber()
  userId: number;

  @IsOptional()
  @IsDateString()
  timePayment: string;
}
