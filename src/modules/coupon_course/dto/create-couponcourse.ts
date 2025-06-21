import { IsBoolean, IsNumber } from 'class-validator';

export class CouponCourseCreateDto {
  @IsNumber()
  couponId: number;

  @IsNumber()
  courseId: number;

  @IsBoolean()
  isAccepted: boolean;

  @IsBoolean()
  isRunning: boolean;
}
