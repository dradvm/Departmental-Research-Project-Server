import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}

  async getCourseEnrolled(
    userId: number,
    sort?: string,
    categoryId?: number,
    progress?: string,
    instructorId?: number
  ) {
    let orderTime = true;
    let orderTitle = false;
    let sortOrderBy = true;

    switch (sort) {
      case 'recentlyAccessed': {
        orderTime = true;
        break;
      }
      case 'recentlyEnrolled': {
        orderTime = false;
        break;
      }
      case 'titleAsc': {
        sortOrderBy = false;
        orderTitle = false;
        break;
      }
      case 'titleDesc': {
        sortOrderBy = false;
        orderTitle = true;
        break;
      }
    }
    return this.prisma.enrollment.findMany({
      where: {
        userId: userId,
        Course: {
          User: {
            userId: instructorId
          },
          CourseCategory: {
            some: {
              Category: {
                categoryId: categoryId
              }
            }
          }
        }
      },
      include: {
        Course: {
          include: {
            User: {
              select: {
                userId: true,
                name: true
              }
            },
            Section: {
              select: {
                Lecture: {
                  select: {
                    StudyProgress: {
                      where: {
                        userId: userId
                      }
                    }
                  },
                  orderBy: { order: 'asc' }
                }
              },
              orderBy: {
                order: 'asc'
              }
            },
            Review: {
              select: {
                rating: true
              }
            }
          }
        }
      },
      orderBy: sortOrderBy
        ? {
            [orderTime ? 'lastAccessedAt' : 'enrolledAt']: 'desc'
          }
        : {
            Course: {
              title: orderTitle ? 'desc' : 'asc'
            }
          }
    });
  }
  async getCourseEnrolledCategories(userId: number) {
    return this.prisma.category.findMany({
      where: {
        CourseCategory: {
          some: {
            Course: {
              Enrollment: {
                some: {
                  userId: userId
                }
              }
            }
          }
        }
      }
    });
  }
  async getCourseEnrolledInstructors(userId: number) {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        isDeleted: false,
        Course: {
          some: {
            Enrollment: {
              some: {
                userId: userId
              }
            }
          }
        }
      },
      select: {
        userId: true,
        name: true
      }
    });
  }
  async updateLastAccessCourse(userId: number, courseId: number) {
    return this.prisma.$executeRawUnsafe(`
      UPDATE Enrollment
      SET lastAccessedAt = NOW()
      WHERE userId = ${userId} AND courseId = ${courseId};
    `);
  }
}
