import {
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req
} from '@nestjs/common';
import { CourseService } from './course.service';
import { LectureService } from './lecture.service';
import { ReviewService } from './review.service';
import { StudyProgressService } from './study-progress.service';
import { ApiRequestData } from 'src/common/base/api.request';
import { EnrollmentService } from './enrollment.service';

@Controller('courses')
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly lectureService: LectureService,
    private readonly reviewService: ReviewService,
    private readonly studyProgressService: StudyProgressService,
    private readonly enrollmentService: EnrollmentService
  ) {}

  @Get('/enrollment')
  getCourseEnrolled(@Req() req: ApiRequestData) {
    return this.enrollmentService.getCourseEnrolled(req.user.userId);
  }
  @Get('/:courseId')
  findCourseById(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.courseService.findById(courseId);
  }

  @Get('/lectures/:lectureId')
  findLectureById(@Param('lectureId', ParseIntPipe) lectureId: number) {
    return this.lectureService.findById(lectureId);
  }

  @Get('/:courseId/reviews/overview')
  getReviewOverView(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.reviewService.getOverviewOfCourse(courseId);
  }

  @Get('/:courseId/reviews')
  findReviews(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query('rating') rating?: string,
    @Query('search') search?: string,
    @Query('cursor') cursor?: string
  ) {
    return this.reviewService.getReviews(
      courseId,
      rating ? parseInt(rating) : undefined,
      search,
      cursor ? parseInt(cursor) : undefined
    );
  }

  @Get('/:courseId/reviews/number')
  findNumberReviews(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query('rating') rating?: string,
    @Query('search') search?: string
  ) {
    return this.reviewService.getNumberReviews(
      courseId,
      rating ? parseInt(rating) : undefined,
      search
    );
  }

  @Get('/:courseId/study-progress')
  getStudyProgress(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: ApiRequestData
  ) {
    return this.studyProgressService.getStudyProgress(
      courseId,
      req.user.userId
    );
  }
  @Get('/:courseId/study-progress/last-lecture')
  getLastLectureStudy(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: ApiRequestData
  ) {
    return this.studyProgressService.getLastLectureStudy(
      courseId,
      req.user.userId
    );
  }
  @Post('/lectures/:lectureId/study-progress/track')
  trackStudyProgress(
    @Param('lectureId', ParseIntPipe) lectureId: number,
    @Query('seconds', ParseIntPipe) seconds: number = 0,
    @Req() req: ApiRequestData
  ) {
    return this.studyProgressService.trackStudyProgress(
      lectureId,
      req.user.userId,
      seconds
    );
  }

  @Patch('/lectures/:lectureId/study-progress/toggle-done')
  toggleStudyProgress(
    @Param('lectureId', ParseIntPipe) lectureId: number,
    @Query('isDone', ParseBoolPipe) isDone: boolean,
    @Req() req: ApiRequestData
  ) {
    return this.studyProgressService.toggleStudyProgress(
      lectureId,
      req.user.userId,
      isDone
    );
  }
}
