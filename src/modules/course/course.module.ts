import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LectureService } from './lecture.service';
import { ReviewService } from './review.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CategoryService } from './category.service';
import { CouponCourseModule } from '../coupon_course/couponcourse.module';
import { CouponModule } from '../coupon/coupon.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, CouponModule, CouponCourseModule],
  controllers: [CourseController],
  providers: [CourseService, LectureService, ReviewService, CategoryService],
  exports: [CourseService, LectureService, ReviewService, CategoryService]
})
export class CourseModule {}
