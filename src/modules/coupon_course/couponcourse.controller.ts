import { Body, Controller, Post } from '@nestjs/common';
import { CouponCourseService } from './couponcourse.service';
import { CouponCourse } from '@prisma/client';
import { CouponCourseCreateDto } from './dto/create-couponcourse';

@Controller('couponcourse')
export class CouponCourseController {
  constructor(private readonly couponCourseService: CouponCourseService) {}

  @Post()
  async createOneCouponCourse(
    @Body() data: CouponCourseCreateDto
  ): Promise<CouponCourse | null> {
    return await this.couponCourseService.addOneCouponToCourse(data);
  }
}
