import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LectureController } from './lecture.controller';
import { LectureService } from './lecture.service';

@Module({
  imports: [PrismaModule],
  controllers: [CourseController, LectureController],
  providers: [CourseService, LectureService],
  exports: [CourseService, LectureService]
})
export class CourseModule {}
