import { Module } from '@nestjs/common';
import { QAController } from './qa.controller';
import { QuestionService } from './question.service';
import { AnswerService } from './answer.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [QAController],
  providers: [QuestionService, AnswerService],
  exports: [QuestionService, AnswerService]
})
export class QAModule {}
