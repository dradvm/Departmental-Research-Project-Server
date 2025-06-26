import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService) {}

  async getQuestions(
    courseId: number,
    orderBy: boolean = true,
    search: string = '',
    userId: number,
    isUser: boolean = false,
    isNone: boolean = false
  ) {
    return this.prisma.question.findMany({
      where: {
        Lecture: {
          Section: {
            courseId: courseId
          }
        },
        ...(search.trim().length > 0 && {
          OR: Array.from(new Set(search.split(' '))).flatMap((word) => [
            {
              questionTitle: {
                contains: word
              }
            },
            {
              questionContent: {
                contains: word
              }
            }
          ])
        }),
        OR: [
          ...(isUser ? [{ userId: userId }] : []),
          ...(isNone ? [{ Answer: {} }] : [])
        ]
      },
      orderBy: {
        createdAt: orderBy ? 'desc' : 'asc'
      }
    });
  }
}
