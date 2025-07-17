import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GoogleService } from '../google/google.service';
import { StudyRemind } from '@prisma/client';

@Injectable()
export class StudyRemindService {
  constructor(
    private prisma: PrismaService,
    private googleService: GoogleService
  ) {}

  getAll(userId: number) {
    return this.prisma.studyRemind.findMany({
      where: {
        userId: userId
      }
    });
  }
  getStudyRemind(studyRemindId: number) {
    return this.prisma.studyRemind.findFirst({
      where: {
        studyRemindId: studyRemindId
      }
    });
  }
  addStudyRemind(
    userId: number,
    googleEventId: string,
    summary: string,
    time: string,
    frequency: 'onetime' | 'daily' | 'weekly',
    description?: string,
    daysOfWeek?: string,
    recurrenceRule?: string
  ) {
    return this.prisma.studyRemind.create({
      data: {
        userId: userId,
        googleEventId,
        summary,
        description,
        time,
        frequency,
        daysOfWeek,
        recurrenceRule
      }
    });
  }
  async updateStudyRemind(studyRemindId: number, code: string) {
    const studyRemind: StudyRemind | null =
      await this.getStudyRemind(studyRemindId);

    if (!studyRemind) {
      throw new Error('Study Remind Not Found');
    }
    await this.googleService.exchangeCode(code);
    const newEvent = await this.googleService.resyncEventIfDeleted(studyRemind);
    return this.prisma.studyRemind.update({
      where: {
        studyRemindId: studyRemindId
      },
      data: {
        googleEventId: newEvent?.id ?? ''
      }
    });
  }
  async deleteStudyRemind(studyRemindId: number, code: string) {
    const studyRemind: StudyRemind | null =
      await this.getStudyRemind(studyRemindId);
    if (!studyRemind) {
      throw new Error('Study Remind Not Found');
    }
    await this.googleService.exchangeCode(code);
    await this.googleService.deleteEvent(studyRemind.googleEventId);
    return this.prisma.studyRemind.delete({
      where: {
        studyRemindId: studyRemindId
      }
    });
  }
}
