import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards
} from '@nestjs/common';
import { CouponCourseService } from './couponcourse.service';
import { CouponCourse } from '@prisma/client';
import { CouponCourseCreateDto } from './dto/create-couponcourse';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';

@Controller('couponcourse')
export class CouponCourseController {
  constructor(private readonly couponCourseService: CouponCourseService) {}

  @Post()
  async createOneCouponCourse(
    @Body() data: CouponCourseCreateDto
  ): Promise<CouponCourse | null> {
    return await this.couponCourseService.addOneCouponToCourse(data);
  }

  // 1/ accept and activate a coupon to a course isRunning: false => true, isAccept: false => true
  // 2/ activate a coupon to a course (ACCPETED) isRunning: false => true, isAccept: true (true => true)
  @UseGuards(JwtAuthGuard)
  @Put('/accept-and-activate')
  async acceptAndActiveACouponCourse(
    @Body() data: CouponCourseCreateDto
  ): Promise<CouponCourse> {
    await this.couponCourseService.resetIsRunningForAllCouponOfACourse(
      data.courseId
    );
    return await this.couponCourseService.updateOneCouponCourse(
      data.couponId,
      data.courseId,
      true,
      true
    );
  }

  // 3/ accept a coupon to a course (ONLY ACCEPT NOT ACTIVATE) isRunning: false, isAccept: false => true
  @UseGuards(JwtAuthGuard)
  @Put('/only-accept')
  async acceptACouponCourse(
    @Body() data: CouponCourseCreateDto
  ): Promise<CouponCourse> {
    await this.couponCourseService.resetIsRunningForAllCouponOfACourse(
      data.courseId
    );
    return await this.couponCourseService.updateOneCouponCourse(
      data.couponId,
      data.courseId,
      false,
      true
    );
  }

  // 4/ deactivate a coupon to a course (ACCEPTED) isRunning: true => false, isAccept: true
  @UseGuards(JwtAuthGuard)
  @Put('/deactivate')
  async deactivateACouponCourse(
    @Body() data: CouponCourseCreateDto
  ): Promise<CouponCourse> {
    return await this.couponCourseService.updateOneCouponCourse(
      data.couponId,
      data.courseId,
      false,
      true
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('/all/:courseId')
  async getAllCouponOfCourse(
    @Param('courseId') courseId: string
  ): Promise<CouponCourse[]> {
    return await this.couponCourseService.getAllCouponOfCourse(
      parseInt(courseId)
    );
  }
}
