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
  addWishlist(userId: number, courseId: number) {
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
}
