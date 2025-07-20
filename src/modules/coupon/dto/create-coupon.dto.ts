import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsString
} from 'class-validator';
import { CouponType } from 'src/enums/coupon-type.enum';

export class CreateCouponDto {
  @IsBoolean()
  isGlobal: boolean;

  @IsEnum(CouponType, { message: 'type must be either discount or voucher' })
  type: CouponType;

  @IsNumber()
  value: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  minRequire: number;

  @IsNumber()
  maxValueDiscount: number;

  @IsString()
  code: string;
}
