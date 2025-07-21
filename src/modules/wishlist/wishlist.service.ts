import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}
  getWishlist(userId: number, search: string = '') {
    return this.prisma.wishlist.findMany({
      where: {
        userId: userId,
        Course: {
          AND: [
            {
              ...(search.trim().length > 0 && {
                OR: Array.from(new Set(search.trim().split(' '))).map(
                  (word) => ({
                    title: {
                      contains: word,
                      not: null
                    }
                  })
                )
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
            Review: {
              select: {
                rating: true
              }
            },
            Section: {
              select: {
                Lecture: {
                  select: {
                    time: true
                  }
                }
              }
            },
            _count: {
              select: {
                Review: true
              }
            }
          }
        }
      }
    });
  }
  async addWishlist(userId: number, courseId: number) {
    try {
      await this.prisma.cart.delete({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        }
      });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code !== 'P2025') throw error;
    }
    return this.prisma.wishlist.create({
      data: {
        courseId: courseId,
        userId: userId
      }
    });
  }
  deleteWishlist(userId: number, courseId: number) {
    return this.prisma.wishlist.delete({
      where: {
        userId_courseId: {
          courseId: courseId,
          userId: userId
        }
      }
    });
  }
  getItemCourseInWishlist(userId: number, courseId: number) {
    if (!userId) {
      return null;
    }
    return this.prisma.wishlist.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId
        }
      }
    });
  }
  getCountWishlist(userId: number) {
    return this.prisma.wishlist.count({
      where: {
        userId: userId
      }
    });
  }
}
