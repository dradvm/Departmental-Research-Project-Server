import {
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Query,
  Req
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { ApiRequestData } from 'src/common/base/api.request';

@Controller('questions')
export class QuestionController {
  constructor(private questionService: QuestionService) {}

  @Get('/:courseId')
  getQuestions(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query('orderBy', ParseBoolPipe) orderBy: boolean,
    @Query('search') search: string,
    @Query('isUser', ParseBoolPipe) isUser: boolean,
    @Query('isNone', ParseBoolPipe) isNone: boolean,
    @Req() req: ApiRequestData
  ) {
    return this.questionService.getQuestions(
      courseId,
      orderBy,
      search,
      req.user.userId,
      isUser,
      isNone
    );
  }

  @Get('/lecture/:lectureId')
  getQuestionsLecture(
    @Param('lectureId', ParseIntPipe) lectureId: number,
    @Query('orderBy', ParseBoolPipe) orderBy: boolean,
    @Query('search') search: string,
    @Query('isUser', ParseBoolPipe) isUser: boolean,
    @Query('isNone', ParseBoolPipe) isNone: boolean,
    @Req() req: ApiRequestData
  ) {
    return this.questionService.getQuestions(
      lectureId,
      orderBy,
      search,
      req.user.userId,
      isUser,
      isNone
    );
  }
}
