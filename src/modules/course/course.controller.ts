import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CourseService } from './course.service';
import { LectureService } from './lecture.service';
import { ReviewService } from './review.service';

@Controller('courses')
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly lectureService: LectureService,
    private readonly reviewService: ReviewService
  ) {}

  @Get('/:courseId')
  getCourseById(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.courseService.findById(courseId);
  }

  @Get('/lectures/:lectureId')
  getLectureById(@Param('lectureId', ParseIntPipe) lectureId: number) {
    return this.lectureService.findById(lectureId);
  }

  @Get('/:courseId/reviews/overview')
  getReviewOverView(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.reviewService.getOverviewOfCourse(courseId);
  }

  @Get('/:courseId/reviews')
  getReviews(
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

  @Get('/:courseId/reviews/total')
  getTotalReviews(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query('rating') rating?: string,
    @Query('search') search?: string
  ) {
    return this.reviewService.getTotalReviews(
      courseId,
      rating ? parseInt(rating) : undefined,
      search
    );
  }
}
