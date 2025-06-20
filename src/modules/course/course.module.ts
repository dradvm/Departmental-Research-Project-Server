import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LectureService } from './lecture.service';
import { ReviewService } from './review.service';

@Module({
  imports: [PrismaModule],
  controllers: [CourseController],
  providers: [CourseService, LectureService, ReviewService],
  exports: [CourseService, LectureService, ReviewService]
})
export class CourseModule {}
