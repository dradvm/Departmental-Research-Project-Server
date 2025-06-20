import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}

  async getCourseEnrolled(userId: number) {
    return this.prisma.enrollment.findMany({
      where: {
        userId: userId
      },
      include: {
        Course: {
          include: {
            User: {
              select: {
                userId: true,
                name: true
              }
            }
          }
        }
      }
    });
  }
}
