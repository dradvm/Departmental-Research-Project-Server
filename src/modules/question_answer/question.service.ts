import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQuestionDTO, UpdateQuestionDTO } from './dto/question';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ImageCloudinary } from '../cloudinary/types/cloudinary-response';
import { AnswerService } from './answer.service';

@Injectable()
export class QuestionService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private answerService: AnswerService
  ) {}

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
        QuestionImage: {
          select: {
            publicId: true,
            secureUrl: true
          }
        },
        _count: {
          select: {
            Answer: true
          }
        }
      },
      take: 5,
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
      take: 5,
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
        QuestionImage: {
          select: {
            publicId: true,
            secureUrl: true
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
  async addQuestion(
    userId: number,
    question: CreateQuestionDTO,
    files: Express.Multer.File[] | undefined
  ) {
    const images: ImageCloudinary[] = await this.cloudinaryService.uploadImages(
      files,
      'questions'
    );
    return this.prisma.question.create({
      data: {
        userId: userId,
        ...question,
        QuestionImage: {
          create: images.map((image) => {
            return {
              publicId: image.public_id,
              secureUrl: image.secure_url
            };
          })
        }
      }
    });
  }
  async getQuestionImagesNotInOldImages(
    oldImages: string | string[],
    questionId: number
  ) {
    return this.prisma.questionImage.findMany({
      where: {
        questionId: questionId,
        publicId: {
          notIn: Array.isArray(oldImages) ? oldImages : [oldImages]
        }
      }
    });
  }

  async clearImages(oldImages: string | string[], questionId: number) {
    const deleteImages = (
      await this.getQuestionImagesNotInOldImages(oldImages, questionId)
    ).map((img) => img.publicId);
    await this.cloudinaryService.deleteImages(deleteImages);
  }

  async updateQuestion(
    body: UpdateQuestionDTO,
    files: Express.Multer.File[] | undefined
  ) {
    if (body.oldImages) {
      await this.clearImages(body.oldImages, body.questionId);
    }
    const images: ImageCloudinary[] = await this.cloudinaryService.uploadImages(
      files,
      'questions'
    );
    return this.prisma.question.update({
      where: {
        questionId: body.questionId
      },
      data: {
        questionTitle: body.questionTitle,
        questionContent: body.questionContent,
        QuestionImage: {
          deleteMany: {
            publicId: {
              notIn:
                body.oldImages !== undefined
                  ? Array.isArray(body.oldImages)
                    ? body.oldImages
                    : [body.oldImages]
                  : undefined
            }
          },
          create: images.map((img) => ({
            publicId: img.public_id,
            secureUrl: img.secure_url
          }))
        }
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
        QuestionImage: {
          select: {
            publicId: true,
            secureUrl: true
          }
        },
        _count: {
          select: {
            Answer: true
          }
        }
      }
    });
  }
  async deleteQuestion(questionId: number) {
    const publicIds = (
      await this.prisma.questionImage.findMany({
        where: {
          questionId: questionId
        }
      })
    ).map((answerImage) => answerImage.publicId);
    await Promise.all([
      this.answerService.deleteAnswers(questionId),
      this.cloudinaryService.deleteImages(publicIds)
    ]);
    return this.prisma.$transaction([
      this.prisma.questionImage.deleteMany({
        where: {
          questionId: questionId
        }
      }),
      this.prisma.question.delete({
        where: {
          questionId: questionId
        }
      })
    ]);
  }
}
