import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LectureService } from './lecture.service';
import { ReviewService } from './review.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [CourseController],
  providers: [CourseService, LectureService, ReviewService],
  exports: [CourseService, LectureService, ReviewService]
})
export class CourseModule { }
