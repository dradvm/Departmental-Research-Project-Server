import { IsNumber } from 'class-validator';

export class UserCouponCreateDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  couponId: number;
}
