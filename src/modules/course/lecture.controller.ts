import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { LectureService } from './lecture.service';

@Controller('courses/lectures')
export class LectureController {
  constructor(private readonly lectureService: LectureService) {}

  @Get('/:id')
  findCourseById(@Param('id', ParseIntPipe) id: number) {
    return this.lectureService.findById(id);
  }
}
