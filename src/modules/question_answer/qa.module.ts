import { Module } from '@nestjs/common';
import { QuestionController } from './question.controller';
import { AnswerController } from './answer.controller';
import { QuestionService } from './question.service';
import { AnswerService } from './answer.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuestionController, AnswerController],
  providers: [QuestionService, AnswerService],
  exports: [QuestionService, AnswerService]
})
export class QAModule {}
