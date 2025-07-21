import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req
} from '@nestjs/common';
import { ApiRequestData } from 'src/common/base/api.request';
import { EnrollmentService } from './enrollment.service';

@Controller('enrollment')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Get('')
  getCourseEnrolled(
    @Req() req: ApiRequestData,
    @Query('sort') sort?: string,
    @Query('categoryId') categoryId?: number,
    @Query('progress') progress?: string,
    @Query('instructorId') instructorId?: number,
    @Query('search') search?: string
  ) {
    return this.enrollmentService.getCourseEnrolled(
      req.user.userId,
      sort,
      categoryId,
      progress,
      instructorId,
      search
    );
  }
  @Get('categories')
  getCategories(@Req() req: ApiRequestData) {
    return this.enrollmentService.getCourseEnrolledCategories(req.user.userId);
  }
  @Get('instructors')
  getInstructors(@Req() req: ApiRequestData) {
    return this.enrollmentService.getCourseEnrolledInstructors(req.user.userId);
  }

  @Patch('lastAccess/:courseId')
  updateLastAccessCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: ApiRequestData
  ) {
    return this.enrollmentService.updateLastAccessCourse(
      req.user.userId,
      courseId
    );
  }
  @Get('home')
  getHomeCourseEnrolledWithLastStudy(@Req() req: ApiRequestData) {
    return this.enrollmentService.getCourseEnrolledWithLastStudy(
      req.user.userId
    );
  }
  @Get('is-enrolled/:courseId')
  isEnrolled(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: ApiRequestData
  ) {
    return this.enrollmentService.isEnrolled(req.user.userId, courseId);
  }
}
