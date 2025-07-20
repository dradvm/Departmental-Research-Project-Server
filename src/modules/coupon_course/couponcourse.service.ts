import { BadRequestException, Injectable } from '@nestjs/common';
import { Coupon, CouponCourse, Course, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCouponforACourseDto } from './dto/create-couponcourse';
import {
  NormalCouponOutputDto,
  NormalCouponResponse
} from '../coupon/dto/output-coupon.dto';
import { getWhereOfNormalCoupon } from 'src/helpers/value-condition-filter';
import { CouponService } from '../coupon/coupon.service';

type CouponCourseWithRelations = CouponCourse & {
  Coupon: Coupon;
  Course: Course;
};

@Injectable()
export class CouponCourseService {
  constructor(
    private prisma: PrismaService,
    private couponService: CouponService
  ) {}

  async addOneCouponToCourse(
    userId: number,
    dataReq: CreateCouponforACourseDto
  ): Promise<CouponCourse> {
    return await this.prisma.$transaction(async (tx) => {
      const { courseId, ...couponReq } = dataReq;
      // check if this course is existing
      const course: Course | null = await tx.course.findUnique({
        where: { courseId }
      });
      if (!course)
        throw new BadRequestException(
          `Can not create couponcourse because course is not existing`
        );
      // check if this course is requesting a coupon or applying a coupon
      const isApplying: boolean = await this.isApplyingCouponforCourse(
        courseId,
        tx
      );
      if (isApplying)
        throw new BadRequestException(
          `Can not create couponcourse because this course is applying or requesting a coupon`
        );
      // add a new coupon and check if it exists
      const coupon: Coupon = await this.couponService.createCoupon(
        userId,
        couponReq,
        tx
      );
      if (!coupon)
        throw new BadRequestException(
          `Can not create couponcourse because could not create coupon`
        );
      const data = {
        courseId: courseId,
        couponId: coupon.couponId,
        isAccepted: false,
        isDeleted: false
      };
      const couponcourse: CouponCourse = await tx.couponCourse.create({ data });
      if (!couponcourse)
        throw new BadRequestException(`Can not create couponcourse`);
      return couponcourse;
    });
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

  // check if a course is requesting or applying a coupon
  async isApplyingCouponforCourse(
    courseId: number,
    tx?: Prisma.TransactionClient
  ): Promise<boolean> {
    const client = tx ?? this.prisma;
    const couponcourseList: CouponCourse[] = await client.couponCourse.findMany(
      {
        where: {
          courseId: courseId,
          isDeleted: false
        }
      }
    );
    if (couponcourseList.length > 0) return true;
    return false;
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
