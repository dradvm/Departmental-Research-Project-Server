import { BadRequestException, Injectable } from '@nestjs/common';
import { Coupon, CouponCourse, Course, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CouponCourseCreateDto } from './dto/create-couponcourse';

type CouponCourseWithRelations = CouponCourse & {
  Coupon: Coupon;
  Course: Course;
};

@Injectable()
export class CouponCourseService {
  constructor(private prisma: PrismaService) {}

  async addOneCouponToCourse(
    data: CouponCourseCreateDto
  ): Promise<CouponCourse> {
    try {
      data.isAccepted = false;
      data.isRunning = false;
      return await this.prisma.couponCourse.create({ data });
    } catch (e) {
      throw new BadRequestException(`
      Can not add a coupon to this course: ${e}  
      `);
    }
  }

  async updateOneCouponCourse(
    data: CouponCourseCreateDto
  ): Promise<CouponCourse> {
    try {
      await this.prisma.couponCourse.updateMany({
        where: {
          courseId: data.courseId
        },
        data: {
          isRunning: false
        }
      });
      return await this.prisma.couponCourse.update({
        where: {
          couponId_courseId: {
            couponId: data.couponId,
            courseId: data.courseId
          }
        },
        data: {
          isRunning: true,
          isAccepted: true
        }
      });
    } catch (e) {
      throw new BadRequestException(`
        Can not update coupon-course: ${e}
      `);
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
          isRunning: true,
          isAccepted: true
        },
        include: {
          Coupon: true,
          Course: true
        }
      });
    } catch (e) {
      throw new BadRequestException(`
       Can not get a running coupon for course: ${e}  
      `);
    }
  }

  async getAllCouponOfCourse(courseId: number): Promise<CouponCourse[]> {
    try {
      return await this.prisma.couponCourse.findMany({
        where: {
          courseId: courseId
        },
        include: {
          Coupon: true,
          Course: true
        }
      });
    } catch (e) {
      throw new BadRequestException(`
        Can not get all coupons of course ${courseId}: ${e}
      `);
    }
  }
}
