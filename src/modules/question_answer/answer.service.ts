import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AnswerService {
  constructor(private prisma: PrismaService) {}

  async getAnswers(questionId: number) {
    return this.prisma.answer.findMany({
      where: {
        questionId: questionId
      },
      include: {
        User: {
          select: {
            name: true,
            img: true,
            isActive: true,
            isDeleted: true
          }
        }
      }
    });
  }
}
