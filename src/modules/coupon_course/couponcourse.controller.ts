import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards
} from '@nestjs/common';
import { CouponCourseService } from './couponcourse.service';
import { CouponCourse } from '@prisma/client';
import {
  CouponCourseCreateDto,
  CreateCouponforACourseDto
} from './dto/create-couponcourse';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { ApiRequestData } from 'src/common/base/api.request';

@Controller('couponcourse')
export class CouponCourseController {
  constructor(private readonly couponCourseService: CouponCourseService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOneCouponCourse(
    @Req() req: ApiRequestData,
    @Body() data: CreateCouponforACourseDto
  ): Promise<CouponCourse | null> {
    return await this.couponCourseService.addOneCouponToCourse(
      req.user.userId,
      data
    );
  }

  // accept a coupon to a course
  @UseGuards(JwtAuthGuard)
  @Put('/accept')
  async acceptACouponCourse(
    @Body() data: CouponCourseCreateDto
  ): Promise<CouponCourse> {
    return await this.couponCourseService.updateOneCouponCourse(
      data.couponId,
      data.courseId,
      true,
      false
    );
  }

  // delete a coupon to a course
  @UseGuards(JwtAuthGuard)
  @Put('/delete')
  async deldeteACouponCourse(
    @Body() data: CouponCourseCreateDto
  ): Promise<CouponCourse> {
    return await this.couponCourseService.updateOneCouponCourse(
      data.couponId,
      data.courseId,
      true,
      true
    );
  }

  // get all coupon-course of teacher
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllCouponOfCourse(
    @Req() req: ApiRequestData
  ): Promise<CouponCourse[]> {
    return await this.couponCourseService.getAllCouponOfCourse(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/check/isApplying/:id')
  async checkIsAppylingCoupon(@Param('id') id: string): Promise<boolean> {
    const courseId: number = parseInt(id);
    if (isNaN(courseId))
      throw new BadRequestException(`courseId: ${courseId} is not valid`);
    return await this.couponCourseService.isApplyingCouponforCourse(courseId);
  }
}
