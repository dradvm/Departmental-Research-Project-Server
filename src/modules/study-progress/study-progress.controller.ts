import {
  Body,
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
import { ApiRequestData } from 'src/common/base/api.request';
import { StudyProgressService } from './study-progress.service';
import { LastLectureDto } from './dto/last-lecture';
import { TrackStudyProgressDto } from './dto/track-study-progress';

@Controller('study-progress')
export class StudyProgressController {
  constructor(private readonly studyProgressService: StudyProgressService) {}

  @Get('/:courseId')
  getStudyProgress(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: ApiRequestData
  ) {
    return this.studyProgressService.getStudyProgress(
      courseId,
      req.user.userId
    );
  }
  @Get('/last-lecture/:courseId')
  getLastLectureStudy(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: ApiRequestData
  ) {
    return this.studyProgressService.getLastLectureStudy(
      courseId,
      req.user.userId
    );
  }
  @Post('/last-lecture/:courseId')
  trackLastLectureStudy(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: ApiRequestData,
    @Body() body: LastLectureDto
  ) {
    return this.studyProgressService.trackLastLectureStudy(
      courseId,
      req.user.userId,
      body.lectureId
    );
  }

  @Get('track-lecture/:lectureId')
  getTrackStudyProgress(
    @Param('lectureId', ParseIntPipe) lectureId: number,
    @Req() req: ApiRequestData
  ) {
    return this.studyProgressService.getTrackStudyProgress(
      lectureId,
      req.user.userId
    );
  }

  @Post('/track-lecture/:lectureId')
  trackStudyProgress(
    @Param('lectureId', ParseIntPipe) lectureId: number,
    @Req() req: ApiRequestData,
    @Body() body: TrackStudyProgressDto
  ) {
    return this.studyProgressService.trackStudyProgress(
      lectureId,
      req.user.userId,
      body.seconds
    );
  }

  @Patch('toggle-lecture/:lectureId')
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
