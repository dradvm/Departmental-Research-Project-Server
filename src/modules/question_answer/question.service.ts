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
    isNone: boolean = false,
    cursor: number = 0
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
      include: {
        User: {
          select: {
            name: true,
            img: true,
            isActive: true,
            isDeleted: true
          }
        },
        _count: {
          select: {
            Answer: true
          }
        }
      },
      take: 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { questionId: cursor } : undefined,
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
    isNone: boolean = false,
    cursor: number = 0
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
      take: 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { questionId: cursor } : undefined,
      include: {
        User: {
          select: {
            name: true,
            img: true,
            isActive: true,
            isDeleted: true
          }
        },
        _count: {
          select: {
            Answer: true
          }
        }
      },
      orderBy: {
        createdAt: orderBy ? 'desc' : 'asc'
      }
    });
  }

  async getTotalQuestions(
    courseId: number,
    orderBy: boolean = true,
    search: string = '',
    userId: number,
    isUser: boolean = false,
    isNone: boolean = false
  ) {
    return this.prisma.question.count({
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

  async getTotalQuestionsLecture(
    lectureId: number,
    orderBy: boolean = true,
    search: string = '',
    userId: number,
    isUser: boolean = false,
    isNone: boolean = false
  ) {
    return this.prisma.question.count({
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
