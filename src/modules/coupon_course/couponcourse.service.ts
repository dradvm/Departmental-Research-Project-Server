import { BadRequestException, Injectable } from '@nestjs/common';
import { CouponCourse } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CouponCourseCreateDto } from './dto/create-couponcourse';

@Injectable()
export class CouponCourseService {
  constructor(private prisma: PrismaService) {}

  async addOneCouponToCourse(
    data: CouponCourseCreateDto
  ): Promise<CouponCourse> {
    try {
      return await this.prisma.couponCourse.create({ data });
    } catch (e) {
      throw new BadRequestException(`
      Can not add a coupon to this course: ${e}  
      `);
    }
  }
}
