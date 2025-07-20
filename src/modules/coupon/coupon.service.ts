import { BadRequestException, Injectable } from '@nestjs/common';
import { Coupon, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { CouponType } from 'src/enums/coupon-type.enum';
import { getWhereOfGlobalCoupon } from 'src/helpers/value-condition-filter';
import { GlobalCouponResponse } from './dto/output-coupon.dto';

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  async isExistingCode(
    code: string,
    tx?: Prisma.TransactionClient
  ): Promise<boolean> {
    try {
      const client = tx ?? this.prisma;
      const coupon = await client.coupon.findFirst({
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
  ): Promise<GlobalCouponResponse> {
    try {
      const where = getWhereOfGlobalCoupon(
        isGlobal,
        startDate,
        endDate,
        minPercent,
        minPrice
      );
      const results: Coupon[] = await this.prisma.coupon.findMany({
        where: where,
        skip: skip,
        take: limit
      });
      const dataLength = (await this.prisma.coupon.findMany({ where: where }))
        .length;
      return {
        globalCoupons: results,
        length: dataLength
      };
    } catch (e) {
      throw new BadRequestException(`Get all global coupons failed: ${e}`);
    }
  }

  async createCoupon(
    userId: number,
    data: CreateCouponDto,
    tx?: Prisma.TransactionClient
  ): Promise<Coupon> {
    try {
      const client = tx ?? this.prisma;
      const checkData: CreateCouponDto = this.getCheckedData(data);
      // check if code is valid
      const couponCodeRegex = /^[a-zA-Z0-9]+$/;

      if (!couponCodeRegex.test(checkData.code)) {
        throw new BadRequestException(
          `Coupon code "${data.code}" is invalid. Only English letters and numbers are allowed.`
        );
      }
      // check if coupon's code is existing
      const isExistingCode: boolean = await this.isExistingCode(
        checkData.code,
        tx
      );
      if (isExistingCode)
        throw new BadRequestException(
          `Can not create coupon because code is existing`
        );
      const finalData = { ...checkData, userId: userId, appliedAmount: 0 };
      return await client.coupon.create({ data: finalData });
    } catch (e) {
      throw new BadRequestException(`Create coupon failed: ${e}`);
    }
  }
}
