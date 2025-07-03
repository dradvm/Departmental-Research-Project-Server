import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAnswerDTO, UpdateAnswerDTO } from './dto/answer';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ImageCloudinary } from '../cloudinary/types/cloudinary-response';

@Injectable()
export class AnswerService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService
  ) {}

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
        },
        AnswerImage: {
          select: {
            publicId: true,
            secureUrl: true
          }
        }
      }
    });
  }
  async addAnswer(
    userId: number,
    answer: CreateAnswerDTO,
    files: Express.Multer.File[] | undefined
  ) {
    const images: ImageCloudinary[] = await this.cloudinaryService.uploadImages(
      files,
      'answers'
    );
    return this.prisma.answer.create({
      data: {
        userId: userId,
        ...answer,
        AnswerImage: {
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
  async getAnswerImagesNotInOldImages(
    oldImages: string | string[],
    answerId: number
  ) {
    return this.prisma.answerImage.findMany({
      where: {
        answerId: answerId,
        publicId: {
          notIn: Array.isArray(oldImages) ? oldImages : [oldImages]
        }
      }
    });
  }

  async clearImages(oldImages: string | string[], answerId: number) {
    const deleteImages = (
      await this.getAnswerImagesNotInOldImages(oldImages, answerId)
    ).map((img) => img.publicId);
    await this.cloudinaryService.deleteImages(deleteImages);
  }

  async updateAnswer(
    body: UpdateAnswerDTO,
    files: Express.Multer.File[] | undefined
  ) {
    if (body.oldImages) {
      await this.clearImages(body.oldImages, body.answerId);
    }
    const images: ImageCloudinary[] = await this.cloudinaryService.uploadImages(
      files,
      'answers'
    );
    return this.prisma.answer.update({
      where: {
        answerId: body.answerId
      },
      data: {
        answerContent: body.answerContent,
        AnswerImage: {
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
        AnswerImage: {
          select: {
            publicId: true,
            secureUrl: true
          }
        }
      }
    });
  }
  async deleteAnswer(answerId: number) {
    await this.clearImages([], answerId);

    return this.prisma.$transaction([
      this.prisma.answerImage.deleteMany({
        where: {
          answerId: answerId
        }
      }),
      this.prisma.answer.delete({
        where: {
          answerId: answerId
        }
      })
    ]);
  }
  async deleteAnswers(questionId: number) {
    const publicIds = (
      await this.prisma.answerImage.findMany({
        where: {
          Answer: {
            questionId: questionId
          }
        }
      })
    ).map((answerImage) => answerImage.publicId);
    await this.cloudinaryService.deleteImages(publicIds);

    return this.prisma.$transaction([
      this.prisma.answerImage.deleteMany({
        where: {
          Answer: {
            questionId: questionId
          }
        }
      }),
      this.prisma.answer.deleteMany({
        where: {
          questionId: questionId
        }
      })
    ]);
  }
}
