import { IsNumber } from 'class-validator';

export class CouponCourseCreateDto {
  @IsNumber()
  couponId: number;

  @IsNumber()
  courseId: number;
}
