import { CloudinaryService } from './../cloudinary/cloudinary.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { ApiRequestData } from 'src/common/base/api.request';
import { AnswerService } from './answer.service';
import { CreateQuestionDTO, UpdateQuestionDTO } from './dto/question';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateAnswerDTO, UpdateAnswerDTO } from './dto/answer';

@Controller('qa')
export class QAController {
  constructor(
    private questionService: QuestionService,
    private answerService: AnswerService,
    private cloudinaryService: CloudinaryService
  ) {}

  @Get('questions/:courseId')
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

  @Get('questions/lecture/:lectureId')
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

  @Get('questions/total/:courseId')
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

  @Get('questions/total/lecture/:lectureId')
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

  @Get(`questions/:questionId/answers`)
  getAnswers(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.answerService.getAnswers(questionId);
  }

  @Post('questions')
  @UseInterceptors(FilesInterceptor('images'))
  async addQuestion(
    @Req() req: ApiRequestData,
    @Body() body: CreateQuestionDTO,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    return this.questionService.addQuestion(req.user.userId, body, files);
  }
  @Patch('questions')
  @UseInterceptors(FilesInterceptor('images'))
  updateQuestion(
    @Req() req: ApiRequestData,
    @Body() body: UpdateQuestionDTO,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    return this.questionService.updateQuestion(body, files);
  }

  @Delete('questions/:questionId')
  async deleteQuestion(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.questionService.deleteQuestion(questionId);
  }

  @Post('answers')
  @UseInterceptors(FilesInterceptor('images'))
  async addAnswer(
    @Req() req: ApiRequestData,
    @Body() body: CreateAnswerDTO,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    return this.answerService.addAnswer(req.user.userId, body, files);
  }
  @Patch('answers')
  @UseInterceptors(FilesInterceptor('images'))
  updateAnswer(
    @Req() req: ApiRequestData,
    @Body() body: UpdateAnswerDTO,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    return this.answerService.updateAnswer(body, files);
  }

  @Delete('/answers/:answerId')
  deleteAnswer(@Param('answerId', ParseIntPipe) answerId: number) {
    return this.answerService.deleteAnswer(answerId);
  }
}
