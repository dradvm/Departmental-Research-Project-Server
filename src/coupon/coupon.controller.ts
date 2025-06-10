import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put
} from '@nestjs/common';
import { CouponService } from './coupon.service';
import { Coupon } from 'generated/prisma';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get('/:id')
  async getCoupon(@Param('id') id: string): Promise<Coupon | string> {
    const coupon = await this.couponService.getCouponById(parseInt(id));
    if (coupon) return coupon;
    else throw new NotFoundException(`Could not find coupon with id: ${id}`);
  }

  @Get('/get/all')
  async getAllCoupons(): Promise<Coupon[]> {
    return await this.couponService.getAllCoupons();
  }

  @Post()
  async createCoupon(
    @Body()
    body: CreateCouponDto
  ): Promise<Coupon> {
    const coupon: Coupon = await this.couponService.createCoupon(body);
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
