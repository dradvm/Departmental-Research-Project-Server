import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { QuestionController } from './question.controller';
import { AnswerController } from './answer.controller';
import { QuestionService } from './question.service';
import { AnswerService } from './answer.service';

@Module({
  imports: [PrismaService],
  controllers: [QuestionController, AnswerController],
  providers: [QuestionService, AnswerService],
  exports: [QuestionService, AnswerService]
})
export class QAModule {}
