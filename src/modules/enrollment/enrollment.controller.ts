import { Controller, Get, Req } from '@nestjs/common';
import { ApiRequestData } from 'src/common/base/api.request';
import { EnrollmentService } from './enrollment.service';

@Controller('enrollment')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Get('')
  getCourseEnrolled(@Req() req: ApiRequestData) {
    return this.enrollmentService.getCourseEnrolled(req.user.userId);
  }
}
