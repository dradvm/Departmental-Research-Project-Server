import { BadRequestException, Injectable } from '@nestjs/common';
import { Coupon, CouponCourse, Course, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CouponCourseCreateDto } from './dto/create-couponcourse';
import {
  NormalCouponOutputDto,
  NormalCouponResponse
} from '../coupon/dto/output-coupon.dto';
import { getWhereOfNormalCoupon } from 'src/helpers/value-condition-filter';

type CouponCourseWithRelations = CouponCourse & {
  Coupon: Coupon;
  Course: Course;
};

@Injectable()
export class CouponCourseService {
  constructor(private prisma: PrismaService) {}

  async addOneCouponToCourse(
    dataReq: CouponCourseCreateDto
  ): Promise<CouponCourse> {
    try {
      const data = {
        ...dataReq,
        isAccepted: false,
        isDeleted: false
      };
      return await this.prisma.couponCourse.create({ data });
    } catch (e) {
      throw new BadRequestException(
        `Can not add a coupon to this course: ${e}`
      );
    }
  }

  async updateOneCouponCourse(
    couponId: number,
    courseId: number,
    isAccepted: boolean,
    isDeleted: boolean
  ): Promise<CouponCourse> {
    try {
      return await this.prisma.couponCourse.update({
        where: {
          couponId_courseId: {
            couponId: couponId,
            courseId: courseId
          }
        },
        data: {
          isDeleted,
          isAccepted
        }
      });
    } catch (e) {
      throw new BadRequestException(`Can not update coupon-course: ${e}`);
    }
  }

  async getIsRunningCouponOfCourse(
    courseId: number,
    tx?: Prisma.TransactionClient
  ): Promise<CouponCourseWithRelations | null> {
    try {
      const client = tx ?? this.prisma;
      return await client.couponCourse.findFirst({
        where: {
          courseId: courseId,
          isAccepted: true,
          isDeleted: false
        },
        include: {
          Coupon: true,
          Course: true
        }
      });
    } catch (e) {
      throw new BadRequestException(
        `Can not get a running coupon for course: ${e}`
      );
    }
  }

  async getAllCouponOfCourse(userId: number): Promise<CouponCourse[]> {
    try {
      return await this.prisma.couponCourse.findMany({
        where: {
          Course: {
            userId: userId
          },
          isDeleted: false
        },
        include: {
          Coupon: true,
          Course: true
        }
      });
    } catch (e) {
      throw new BadRequestException(
        `Can not get all coupons of course ${userId}: ${e}`
      );
    }
  }

  // NOTICE: THIS SERVICE WILL SUPPORT COUPON CONTROLLER
  async getAllNormalCoupons(
    skip: number,
    limit: number,
    teacherId?: number,
    startDate?: string,
    endDate?: string,
    minPercent?: number,
    minPrice?: number,
    searchText?: string
  ): Promise<NormalCouponResponse> {
    try {
      const where = getWhereOfNormalCoupon(
        teacherId,
        startDate,
        endDate,
        minPercent,
        minPrice,
        searchText
      );
      const data = await this.prisma.couponCourse.findMany({
        where: where,
        skip: skip,
        take: limit,
        include: {
          Coupon: true,
          Course: {
            include: {
              User: true
            }
          }
        }
      });
      const dataLength = (
        await this.prisma.couponCourse.findMany({
          where: where
        })
      ).length;
      const result: NormalCouponOutputDto[] = data.map((da) => ({
        couponId: da.couponId,
        type: da.Coupon.type,
        value: da.Coupon.value,
        startDate: da.Coupon.startDate.toISOString(),
        endDate: da.Coupon.endDate.toISOString(),
        quantity: da.Coupon.quantity,
        appliedAmount: da.Coupon.appliedAmount,
        minRequire: da.Coupon.minRequire,
        maxValueDiscount: da.Coupon.maxValueDiscount,
        code: da.Coupon.code,
        isGlobal: da.Coupon.isGlobal,
        // status
        isAccepted: da.isAccepted,
        isDeleted: da.isDeleted,
        // course information
        courseId: da.Course.courseId,
        coureTitle: da.Course.title,
        userId: da.Course.User?.userId || null,
        userName: da.Course.User?.name || null
      }));
      return {
        normalCoupons: result,
        length: dataLength
      };
    } catch (e) {
      throw new BadRequestException(`Get all normal coupons failed: ${e}`);
    }
  }
}
