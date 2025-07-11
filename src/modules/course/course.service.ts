import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Course } from '@prisma/client';
@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Course[]> {
    return this.prisma.course.findMany();
  }

  async findById(courseId: number): Promise<Course | null> {
    return this.prisma.course.findUnique({
      where: { courseId: courseId },
      include: {
        Section: {
          include: {
            Lecture: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: {
            order: 'asc'
          }
        },
        User: {
          select: {
            userId: true,
            name: true
          }
        },
        CourseCategory: {
          include: {
            Category: true
          }
        },
        CourseObjective: true,
        Wishlist: true,
        Review: true,
        _count: {
          select: {
            Enrollment: true,
            Review: true
          }
        }
      }
    });
  }
  async findOtherCourseOfInstructor(
    courseId: number,
    userId: number,
    instructorId: number
  ) {
    return this.prisma.course.findMany({
      where: {
        courseId: {
          not: courseId
        },
        userId: instructorId
      },
      include: {
        Section: {
          include: {
            Lecture: true
          }
        },
        Review: true,
        _count: {
          select: {
            Enrollment: true
          }
        },
        Wishlist: {
          where: {
            userId: userId
          }
        }
      },
      orderBy: [
        {
          Enrollment: {
            _count: 'desc'
          }
        }
      ]
    });
  }
}
