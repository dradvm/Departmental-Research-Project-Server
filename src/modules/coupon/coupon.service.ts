import { BadRequestException, Injectable } from '@nestjs/common';
import { Coupon, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { CouponType } from 'src/enums/coupon-type.enum';
import { getWhereOfGlobalCoupon } from 'src/helpers/value-condition-filter';

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  async isExistingCode(code: string): Promise<boolean> {
    try {
      const coupon = await this.prisma.coupon.findFirst({
        where: { code: code }
      });
      if (coupon) return true;
      else return false;
    } catch (e) {
      throw new BadRequestException(`
        Can not check if code ${code} is existing: ${e}
      `);
    }
  }

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
        `appliedAmount can not be more than quantity!`
      );
    }

    if (data.appliedAmount < 0)
      throw new BadRequestException(
        `appliedAmount should be greater than or equal to 0`
      );

    if (data.quantity < 0)
      throw new BadRequestException(
        `quantity should be greater than or equal to 0`
      );

    if (data.minRequire < 0)
      throw new BadRequestException(
        `minRequire should be greater than or equal to 0`
      );

    if (data.maxValueDiscount < 0)
      throw new BadRequestException(
        `maxValueDiscount should be greater than or equal to 0`
      );

    // Discount: 10%, 40%
    if (data.type === CouponType.DISCOUNT) {
      if (data.value > 100 || data.value <= 0)
        throw new BadRequestException(`discount value is only form 1 to 100`);
    }
    // Voucher 300 000, 10 000
    if (data.type === CouponType.VOUCHER) {
      if (!data.code) throw new BadRequestException(`voucher must have a code`);
    }
    // appliedAmount is not null
    if (!data.appliedAmount) data.appliedAmount = 0;
    // set time for endDate
    const newEndDate = new Date(data.endDate);
    newEndDate.setHours(23, 59, 59, 0);
    data.endDate = newEndDate.toISOString();
    return data;
  }

  async getCouponById(
    id: number,
    tx?: Prisma.TransactionClient
  ): Promise<Coupon | null> {
    try {
      const client = tx ?? this.prisma;
      return await client.coupon.findUnique({
        where: {
          couponId: id
        }
      });
    } catch (e) {
      throw new BadRequestException(`Get coupon with id ${id} failed: ${e}`);
    }
  }

  async getCouponByCode(code: string): Promise<Coupon | null> {
    try {
      return await this.prisma.coupon.findFirst({
        where: { code: code }
      });
    } catch (e) {
      throw new BadRequestException(`
        Can not find coupon with code ${code}: ${e}
      `);
    }
  }

  async getAllGlobalCoupons(
    skip: number,
    limit: number,
    isGlobal: boolean,
    startDate?: string,
    endDate?: string,
    minPercent?: number,
    minPrice?: number
  ): Promise<Coupon[]> {
    try {
      const where = getWhereOfGlobalCoupon(
        isGlobal,
        startDate,
        endDate,
        minPercent,
        minPrice
      );
      return await this.prisma.coupon.findMany({
        where: where,
        skip: skip,
        take: limit
      });
    } catch (e) {
      throw new BadRequestException(`Get all global coupons failed: ${e}`);
    }
  }

  async createCoupon(userId: number, data: CreateCouponDto): Promise<Coupon> {
    try {
      const checkData: CreateCouponDto = this.getCheckedData(data);
      const finalData = { ...checkData, userId: userId };
      return await this.prisma.coupon.create({ data: finalData });
    } catch (e) {
      throw new BadRequestException(`Create coupon failed: ${e}`);
    }
  }

  async updateCoupon(id: number, data: CreateCouponDto): Promise<Coupon> {
    try {
      const checkData: CreateCouponDto = this.getCheckedData(data);
      return await this.prisma.coupon.update({
        where: {
          couponId: id
        },
        data: checkData
      });
    } catch (e) {
      throw new BadRequestException(`Update coupon with id ${id} failed: ${e}`);
    }
  }

  async deleteCoupon(id: number): Promise<Coupon> {
    try {
      return await this.prisma.coupon.delete({
        where: {
          couponId: id
        }
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
