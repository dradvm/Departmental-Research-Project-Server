import { BadRequestException, Injectable } from '@nestjs/common';
import { Coupon } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { CouponType } from './enums/coupon-type.enum';

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  getCheckedData(data: CreateCouponDto): CreateCouponDto {
    if (data.startDate || data.endDate) {
      if (!data.startDate)
        throw new BadRequestException(`startData is invalid!`);
      if (!data.endDate) throw new BadRequestException(`endDate is invalid!`);
      if (data.startDate > data.endDate)
        throw new BadRequestException(`startDate can not be after endaDate!`);
    }

    if (data.appliedAmount > data.quantity) {
      throw new BadRequestException(
        `appliedAmount can not be more than quantity!`,
      );
    }

    if (data.appliedAmount < 0)
      throw new BadRequestException(
        `appliedAmount should be greater than or equal to 0`,
      );

    if (data.quantity < 0)
      throw new BadRequestException(
        `quantity should be greater than or equal to 0`,
      );

    if (data.minRequire < 0)
      throw new BadRequestException(
        `minRequire should be greater than or equal to 0`,
      );

    if (data.maxValueDiscount < 0)
      throw new BadRequestException(
        `maxValueDiscount should be greater than or equal to 0`,
      );

    // Discount: 10%, 40%
    if (data.type === CouponType.DISCOUNT) {
      if (data.value > 100 || data.value <= 0)
        throw new BadRequestException(`discount value is only form 1 to 100`);
      data.code = '';
    }
    // Voucher 300 000, 10 000
    if (data.type === CouponType.VOUCHER) {
      if (!data.code) throw new BadRequestException(`voucher must have a code`);
    }
    // appliedAmount is not null
    if (!data.appliedAmount) data.appliedAmount = 0;

    return data;
  }

  async getCouponById(id: number): Promise<Coupon | null> {
    try {
      return await this.prisma.coupon.findUnique({
        where: {
          idCoupon: id,
        },
      });
    } catch (e) {
      throw new BadRequestException(`Get coupon with id ${id} failed: ${e}`);
    }
  }

  async getAllCoupons(): Promise<Coupon[]> {
    try {
      return await this.prisma.coupon.findMany();
    } catch (e) {
      throw new BadRequestException(`Get all coupons failed: ${e}`);
    }
  }

  async createCoupon(data: CreateCouponDto): Promise<Coupon> {
    try {
      const checkData: CreateCouponDto = this.getCheckedData(data);
      return await this.prisma.coupon.create({ data: checkData });
    } catch (e) {
      throw new BadRequestException(`Create coupon failed: ${e}`);
    }
  }

  async updateCoupon(id: number, data: CreateCouponDto): Promise<Coupon> {
    try {
      const checkData: CreateCouponDto = this.getCheckedData(data);
      return await this.prisma.coupon.update({
        where: {
          idCoupon: id,
        },
        data: checkData,
      });
    } catch (e) {
      throw new BadRequestException(`Update coupon with id ${id} failed: ${e}`);
    }
  }

  async deleteCoupon(id: number): Promise<Coupon> {
    try {
      return await this.prisma.coupon.delete({
        where: {
          idCoupon: id,
        },
      });
    } catch (e) {
      throw new BadRequestException(`Delete coupon with id ${id} failed: ${e}`);
    }
  }

  async deleteAllCoupons(): Promise<{ count: number }> {
    try {
      const deleted = await this.prisma.coupon.deleteMany();
      return deleted;
    } catch (e) {
      throw new BadRequestException(`Delete all coupons failed: ${e}`);
    }
  }
}
