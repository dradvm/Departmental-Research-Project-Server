import { Injectable } from '@nestjs/common';
import { LastLectureStudy } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StudyProgressService {
  constructor(private prisma: PrismaService) {}

  async getStudyProgress(courseId: number, userId: number) {
    return this.prisma.studyProgress.findMany({
      where: {
        userId: userId,
        Lecture: {
          Section: {
            Course: {
              courseId: courseId
            }
          }
        }
      }
    });
  }

  async trackStudyProgress(lectureId: number, userId: number, seconds: number) {
    return this.prisma.studyProgress.upsert({
      where: {
        userId_lectureId: {
          userId: userId,
          lectureId: lectureId
        }
      },
      update: {
        currentTime: seconds
      },
      create: {
        userId: userId,
        lectureId: lectureId
      }
    });
  }
  async toggleStudyProgress(
    lectureId: number,
    userId: number,
    isDone: boolean
  ) {
    return this.prisma.studyProgress.update({
      where: {
        userId_lectureId: {
          userId: userId,
          lectureId: lectureId
        }
      },
      data: {
        isDone: isDone
      }
    });
  }

  getLastLectureStudy(
    courseId: number,
    userId: number
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  ): Promise<LastLectureStudy | null> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.prisma.lastLectureStudy.findFirst({
      where: {
        userId: userId,
        Lecture: {
          Section: {
            courseId: courseId
          }
        }
      }
    });
  }
}
