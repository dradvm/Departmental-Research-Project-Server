import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { Coupon } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { ApiRequestData } from 'src/common/base/api.request';
import {
  GlobalCouponResponse,
  NormalCouponResponse
} from './dto/output-coupon.dto';
import { CouponCourseService } from '../coupon_course/couponcourse.service';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/decorator/role.decorator';

@Controller('coupon')
export class CouponController {
  constructor(
    private readonly couponService: CouponService,
    private readonly couponCourseService: CouponCourseService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  async getCoupon(@Param('id') id: string): Promise<Coupon> {
    const coupon = await this.couponService.getCouponById(parseInt(id));
    if (coupon) return coupon;
    else throw new NotFoundException(`Could not find coupon with id: ${id}`);
  }

  // get all normal coupon
  // NOTICE: THIS CONTROLLER IS SUPPORTED BY COUPONCOURSE SERVICE
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('/get/all/normal')
  async getAllCoupons(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('minPrice') minPrice?: string,
    @Query('minPercent') minPercent?: string,
    @Query('searchText') searchText?: string
  ): Promise<NormalCouponResponse> {
    const teacherId: number | undefined = userId ? parseInt(userId) : undefined;
    return await this.couponCourseService.getAllNormalCoupons(
      parseInt(skip),
      parseInt(limit),
      teacherId || undefined,
      startDate || undefined,
      endDate || undefined,
      minPercent ? parseInt(minPercent) : undefined,
      minPrice ? parseInt(minPrice) : undefined,
      searchText || undefined
    );
  }

  // get all global coupon
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('/get/all/global')
  async getAllGlobalCoupons(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('minPercent') minPercent?: string,
    @Query('minPrice') minPrice?: string
  ): Promise<GlobalCouponResponse> {
    return await this.couponService.getAllGlobalCoupons(
      parseInt(skip),
      parseInt(limit),
      true,
      startDate || undefined,
      endDate || undefined,
      minPercent ? parseInt(minPercent) : undefined,
      minPrice ? parseInt(minPrice) : undefined
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(`isExisting/:code`)
  async checkIsExistingCode(@Param('code') code: string): Promise<boolean> {
    return await this.couponService.isExistingCode(code);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  async createCoupon(
    @Req() req: ApiRequestData,
    @Body()
    body: CreateCouponDto
  ): Promise<Coupon> {
    const coupon: Coupon = await this.couponService.createCoupon(
      req.user.userId,
      body
    );
    return coupon;
  }
}
