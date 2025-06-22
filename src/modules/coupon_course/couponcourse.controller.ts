import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put
} from '@nestjs/common';
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

  @Put()
  async updateOneCouponCourse(
    @Body() data: CouponCourseCreateDto
  ): Promise<CouponCourse> {
    return await this.couponCourseService.updateOneCouponCourse(data);
  }

  @Get('course/:courseId')
  async getIsRunningCouponCourse(
    @Param('courseId') courseId: string
  ): Promise<CouponCourse | null> {
    const result = await this.couponCourseService.getIsRunningCouponOfCourse(
      parseInt(courseId)
    );
    if (result) return result;
    else
      throw new NotFoundException(`
      There is no coupon of course ${courseId} that is running and is accepted
      `);
  }

  @Get('/all/:courseId')
  async getAllCouponOfCourse(
    @Param('courseId') courseId: string
  ): Promise<CouponCourse[]> {
    return await this.couponCourseService.getAllCouponOfCourse(
      parseInt(courseId)
    );
  }
}
