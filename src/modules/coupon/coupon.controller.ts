import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
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

@Controller('coupon')
export class CouponController {
  constructor(
    private readonly couponService: CouponService,
    private readonly couponCourseService: CouponCourseService
  ) {}

  @Get('/:id')
  async getCoupon(@Param('id') id: string): Promise<Coupon> {
    const coupon = await this.couponService.getCouponById(parseInt(id));
    if (coupon) return coupon;
    else throw new NotFoundException(`Could not find coupon with id: ${id}`);
  }

  @Get('/byCode/:code')
  async getCouponByCode(@Param('code') code: string): Promise<Coupon> {
    const coupon = await this.couponService.getCouponByCode(code);
    if (coupon) return coupon;
    else throw new NotFoundException(`Could not find coupon by code ${code}`);
  }

  // get all normal coupon
  // NOTICE: THIS CONTROLLER IS SUPPORTED BY COUPONCOURSE SERVICE
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
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

  @Put('/:id')
  async updateCoupon(
    @Param('id') id: string,
    @Body()
    body: CreateCouponDto
  ): Promise<Coupon> {
    const coupon = await this.couponService.updateCoupon(parseInt(id), body);
    return coupon;
  }

  @Delete(`/:id`)
  async deleteCoupon(@Param(`id`) id: string): Promise<Coupon> {
    const deletedCoupon = await this.couponService.deleteCoupon(parseInt(id));
    return deletedCoupon;
  }

  @Delete(`delete/all`)
  async deleteAllCoupons(): Promise<string> {
    const deleted = await this.couponService.deleteAllCoupons();
    return `Deleted ${deleted.count} coupons`;
  }
}
