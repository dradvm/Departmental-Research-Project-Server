import { IsNumber, ValidateIf } from 'class-validator';

export class PaymentDetailCreateDto {
  @IsNumber()
  paymentId: number;

  @IsNumber()
  courseId: number;

  @ValidateIf((obj: PaymentDetailCreateDto) => obj.couponId !== null)
  @IsNumber()
  couponId: number | null;
}
