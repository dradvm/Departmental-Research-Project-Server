import { Injectable } from '@nestjs/common';
import { LastLectureStudy, Lecture } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StudyProgressService {
  constructor(private prisma: PrismaService) {}

  async getCourseStudyProgress(courseId: number, userId: number) {
    return this.prisma.course.findUnique({
      where: { courseId: courseId },
      include: {
        Section: {
          include: {
            Lecture: {
              orderBy: { order: 'asc' },
              include: {
                StudyProgress: {
                  where: {
                    userId: userId
                  }
                }
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
  }

  async getTrackStudyProgress(lectureId: number, userId: number) {
    return this.prisma.studyProgress.upsert({
      where: {
        userId_lectureId: {
          userId: userId,
          lectureId: lectureId
        }
      },
      update: {},
      create: {
        userId: userId,
        lectureId: lectureId
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
  ): Promise<LastLectureStudy | null> {
    return this.prisma.lastLectureStudy.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId
        }
      }
    });
  }

  trackLastLectureStudy(
    courseId: number,
    userId: number,
    lectureId: number
  ): Promise<LastLectureStudy> {
    return this.prisma.lastLectureStudy.upsert({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId
        }
      },
      update: {
        lectureId: lectureId
      },
      create: {
        userId: userId,
        courseId: courseId,
        lectureId: lectureId
      }
    });
  }

  async addAllStudyProgressUser(userId: number, courseId: number) {
    const lectures = await this.prisma.lecture.findMany({
      where: {
        Section: {
          courseId: courseId
        }
      },
      include: {
        Section: true
      }
    });
    const data = lectures.map((lecture: Lecture) => ({
      userId: userId,
      lectureId: lecture.lectureId
    }));

    return this.prisma.studyProgress.createMany({
      data: data
    });
  }
  async addLastLectureStudyInit(userId: number, courseId: number) {
    const firstLecture =
      (
        await this.prisma.section.findFirst({
          where: { courseId },
          orderBy: { order: 'asc' },
          select: {
            Lecture: {
              orderBy: { order: 'asc' },
              take: 1
            }
          }
        })
      )?.Lecture[0] || null;
    if (!firstLecture) {
      return;
    }
    return this.trackLastLectureStudy(
      courseId,
      userId,
      firstLecture?.lectureId
    );
  }
}
