import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  Req
} from '@nestjs/common';
import { CourseService } from './course.service';
import { LectureService } from './lecture.service';
import { ReviewService } from './review.service';
import { ApiRequestData } from 'src/common/base/api.request';

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

  @Get('/:courseId/others')
  getOtherCourses(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query('instructorId', ParseIntPipe) instructorId: number,
    @Req() req: ApiRequestData
  ) {
    return this.courseService.findOtherCourseOfInstructor(
      courseId,
      req.user.userId,
      instructorId
    );
  }

  @Get()
  async getAllCourses(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('minTime') minTime?: string,
    @Query('maxTime') maxTime?: string,
    @Query('minLectureCount') minLectureCount?: string,
    @Query('maxLectureCount') maxLectureCount?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('searchText') searchText?: string
  ) {
    return await this.courseService.getFilteredCoursesWithPagination(
      parseInt(limit),
      parseInt(skip),
      minTime !== undefined ? parseInt(minTime) : undefined,
      maxTime !== undefined ? parseInt(maxTime) : undefined,
      minLectureCount !== undefined ? parseInt(minLectureCount) : undefined,
      maxLectureCount !== undefined ? parseInt(maxLectureCount) : undefined,
      minPrice !== undefined ? parseInt(minPrice) : undefined,
      maxPrice !== undefined ? parseInt(maxPrice) : undefined,
      searchText !== undefined ? searchText : undefined
    );
  }

  // accpet: isAccept: true
  @Put('/accept/:id')
  async acceptCourse(@Param('id') id: string) {
    const courseId: number = parseInt(id);
    if (isNaN(courseId))
      throw new BadRequestException(
        `courseId is invalid, can not accept course with id: ${courseId}`
      );
    return this.courseService.acceptCourse(courseId);
  }
}
