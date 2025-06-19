import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LectureService } from './lecture.service';
import { ReviewService } from './review.service';
import { StudyProgressService } from './study-progress.service';
import { EnrollmentService } from './enrollment.service';

@Module({
  imports: [PrismaModule],
  controllers: [CourseController],
  providers: [
    CourseService,
    LectureService,
    ReviewService,
    StudyProgressService,
    EnrollmentService
  ],
  exports: [
    CourseService,
    LectureService,
    ReviewService,
    StudyProgressService,
    EnrollmentService
  ]
})
export class CourseModule {}
