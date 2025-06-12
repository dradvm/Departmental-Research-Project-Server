import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CourseService } from './course.service';

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get('')
  findAll() {
    return this.courseService.findAll();
  }

  @Get('/:id')
  findCourseById(@Param('id', ParseIntPipe) id: number) {
    return this.courseService.findById(id);
  }
}
