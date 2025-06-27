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
        AND: [
          {
            Lecture: {
              Section: {
                courseId: courseId
              }
            }
          },
          {
            OR: [
              ...(isUser ? [{ userId: userId }] : []),
              ...(isNone ? [{ Answer: { none: {} } }] : [])
            ]
          },
          {
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
            })
          }
        ]
      },
      orderBy: {
        createdAt: orderBy ? 'desc' : 'asc'
      }
    });
  }

  async getQuestionsLecture(
    lectureId: number,
    orderBy: boolean = true,
    search: string = '',
    userId: number,
    isUser: boolean = false,
    isNone: boolean = false
  ) {
    return this.prisma.question.findMany({
      where: {
        AND: [
          {
            lectureId: lectureId
          },
          {
            OR: [
              ...(isUser ? [{ userId: userId }] : []),
              ...(isNone ? [{ Answer: { none: {} } }] : [])
            ]
          },
          {
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
            })
          }
        ]
      },
      orderBy: {
        createdAt: orderBy ? 'desc' : 'asc'
      }
    });
  }
}
