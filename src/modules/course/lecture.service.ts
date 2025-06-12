import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Lecture } from '@prisma/client';
@Injectable()
export class LectureService {
  constructor(private prisma: PrismaService) {}

  async findById(lectureId: number): Promise<Lecture | null> {
    return this.prisma.lecture.findUnique({
      where: { lectureId: lectureId }
    });
  }
}
