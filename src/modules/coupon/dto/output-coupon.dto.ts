import { Decimal } from '@prisma/client/runtime/library';
import {
  IsBoolean,
  IsDecimal,
  IsNumber,
  IsString,
  ValidateIf
} from 'class-validator';

export class NormalCouponOutputDto {
  @IsNumber()
  couponId: number;

  @IsString()
  type: string;

  @IsDecimal()
  value: Decimal;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  appliedAmount: number;

  @IsDecimal()
  minRequire: Decimal;

  @IsDecimal()
  maxValueDiscount: Decimal;

  @IsString()
  code: string;

  @IsBoolean()
  isGlobal: boolean;

  // status
  @IsBoolean()
  isRunning: boolean;

  @IsBoolean()
  isAccepted: boolean;

  // course information
  @IsNumber()
  courseId: number;

  @ValidateIf((o: NormalCouponOutputDto) => o.coureTitle !== null)
  @IsString()
  coureTitle: string | null;

  @ValidateIf((o: NormalCouponOutputDto) => o.userId !== null)
  @IsNumber()
  userId: number | null;

  @ValidateIf((o: NormalCouponOutputDto) => o.userName !== null)
  @IsString()
  userName: string | null;
}
