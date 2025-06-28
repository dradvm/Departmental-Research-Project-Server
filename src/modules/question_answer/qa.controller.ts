import { CloudinaryService } from './../cloudinary/cloudinary.service';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { ApiRequestData } from 'src/common/base/api.request';
import { AnswerService } from './answer.service';
import { CreateQuestionDTO } from './dto/question';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('questions')
export class QAController {
  constructor(
    private questionService: QuestionService,
    private answerService: AnswerService,
    private cloudinaryService: CloudinaryService
  ) {}

  @Get('/:courseId')
  getQuestions(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query('orderBy', ParseBoolPipe) orderBy: boolean,
    @Query('search') search: string,
    @Query('isUser', ParseBoolPipe) isUser: boolean,
    @Query('isNone', ParseBoolPipe) isNone: boolean,
    @Req() req: ApiRequestData,
    @Query('cursor') cursor?: string
  ) {
    return this.questionService.getQuestions(
      courseId,
      orderBy,
      search,
      req.user.userId,
      isUser,
      isNone,
      cursor ? parseInt(cursor) : undefined
    );
  }

  @Get('/lecture/:lectureId')
  getQuestionsLecture(
    @Param('lectureId', ParseIntPipe) lectureId: number,
    @Query('orderBy', ParseBoolPipe) orderBy: boolean,
    @Query('search') search: string,
    @Query('isUser', ParseBoolPipe) isUser: boolean,
    @Query('isNone', ParseBoolPipe) isNone: boolean,
    @Req() req: ApiRequestData,
    @Query('cursor') cursor?: string
  ) {
    return this.questionService.getQuestionsLecture(
      lectureId,
      orderBy,
      search,
      req.user.userId,
      isUser,
      isNone,
      cursor ? parseInt(cursor) : undefined
    );
  }

  @Get('/total/:courseId')
  getTotalQuestions(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query('orderBy', ParseBoolPipe) orderBy: boolean,
    @Query('search') search: string,
    @Query('isUser', ParseBoolPipe) isUser: boolean,
    @Query('isNone', ParseBoolPipe) isNone: boolean,
    @Req() req: ApiRequestData
  ) {
    return this.questionService.getTotalQuestions(
      courseId,
      orderBy,
      search,
      req.user.userId,
      isUser,
      isNone
    );
  }

  @Get('/total/lecture/:lectureId')
  getTotalQuestionsLecture(
    @Param('lectureId', ParseIntPipe) lectureId: number,
    @Query('orderBy', ParseBoolPipe) orderBy: boolean,
    @Query('search') search: string,
    @Query('isUser', ParseBoolPipe) isUser: boolean,
    @Query('isNone', ParseBoolPipe) isNone: boolean,
    @Req() req: ApiRequestData
  ) {
    return this.questionService.getTotalQuestionsLecture(
      lectureId,
      orderBy,
      search,
      req.user.userId,
      isUser,
      isNone
    );
  }

  @Get(`/:questionId/answers`)
  getAnswers(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.answerService.getAnswers(questionId);
  }

  @Post('')
  @UseInterceptors(FilesInterceptor('images'))
  addQuestion(
    @Req() req: ApiRequestData,
    @Body() body: CreateQuestionDTO,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    console.log(files);
    return {};
  }
}
