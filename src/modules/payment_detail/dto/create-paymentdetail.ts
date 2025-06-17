import { IsNotEmpty, IsNumber } from 'class-validator';

export class PaymentDetailCreateDto {
  @IsNumber()
  paymentId: number;

  @IsNumber()
  courseId: number;

  @IsNumber()
  @IsNotEmpty({ message: `price is not empty` })
  price: number;
}
