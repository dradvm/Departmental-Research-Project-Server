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
    instructorId?: number,
    search: string = ''
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
    let inProgress = undefined;

    if (progress === 'inProgress') {
      inProgress = true;
    } else if (progress === 'completed') {
      inProgress = false;
    }

    let inProgressFilter = undefined;
    if (inProgress) {
      inProgressFilter = {
        some: {
          Lecture: {
            some: {
              StudyProgress: {
                some: {
                  userId: userId,
                  isDone: false
                }
              }
            }
          }
        }
      };
    } else if (inProgress === false) {
      inProgressFilter = {
        every: {
          Lecture: {
            every: {
              StudyProgress: {
                some: {
                  userId: userId,
                  isDone: true
                }
              }
            }
          }
        }
      };
    }

    return this.prisma.enrollment.findMany({
      where: {
        userId: userId,
        Course: {
          User: {
            userId: instructorId
          },
          Section: {
            ...inProgressFilter
          },
          CourseCategory: {
            some: {
              Category: {
                categoryId: categoryId
              }
            }
          },
          AND: [
            {
              ...(search.trim().length > 0 && {
                OR: Array.from(new Set(search.split(' '))).map((word) => ({
                  title: {
                    contains: word,
                    not: null
                  }
                }))
              })
            }
          ]
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
