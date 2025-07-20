import { ReviewOverview } from './types/review-overview';
import { Injectable } from '@nestjs/common';
import { Review } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async getNumberReviewOfCourseByStar(courseId: number, rating: number) {
    return this.prisma.review.count({
      where: {
        courseId: courseId,
        rating: rating,
        User: {
          isDeleted: false
        }
      }
    });
  }
  async getTotalNumberReviewOfCourse(courseId: number) {
    return this.prisma.review.count({
      where: {
        courseId: courseId,
        User: {
          isDeleted: false
        }
      }
    });
  }

  async getOverviewOfCourse(courseId: number): Promise<ReviewOverview> {
    const ratings = [
      await this.getNumberReviewOfCourseByStar(courseId, 1),
      await this.getNumberReviewOfCourseByStar(courseId, 2),
      await this.getNumberReviewOfCourseByStar(courseId, 3),
      await this.getNumberReviewOfCourseByStar(courseId, 4),
      await this.getNumberReviewOfCourseByStar(courseId, 5)
    ];
    const totalReview = await this.getTotalNumberReviewOfCourse(courseId);

    const average =
      ratings.reduce(
        (total, rating, index) => total + rating * (index + 1),
        0
      ) / totalReview;

    const total = ratings.reduce((a, b) => a + b, 0);
    const raw = ratings.map((c) => (c / total) * 100);
    const floored = raw.map((p) => Math.floor(p));
    const diff = 100 - floored.reduce((a, b) => a + b, 0);

    const remainders = raw.map((p, i) => ({ i, r: p - floored[i] }));
    remainders.sort((a, b) => b.r - a.r);

    for (let i = 0; i < diff; i++) {
      floored[remainders[i].i]++;
    }
    const reviewOverview: ReviewOverview = {
      ratings: Array.from({ length: 5 }, (value, index) => {
        return {
          percent: floored[index],
          review: ratings[index]
        };
      }),

      average: Number(average.toFixed(1)),
      total: totalReview
    };
    return reviewOverview;
  }

  async getReviews(
    courseId: number,
    rating?: number,
    search: string = '',
    cursor: number = 0
  ): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: {
        courseId: courseId,
        rating: rating ?? undefined,
        AND: [
          {
            review: {
              not: null
            },
            ...(search.trim().length > 0 && {
              OR: Array.from(new Set(search.trim().split(' '))).map((word) => ({
                review: {
                  contains: word,
                  not: null
                }
              }))
            })
          }
        ]
      },
      take: 10,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { reviewId: cursor } : undefined,
      include: {
        User: {
          select: {
            name: true,
            img: true,
            isActive: true,
            isDeleted: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getTotalReviews(
    courseId: number,
    rating?: number,
    search: string = ''
  ) {
    return this.prisma.review.count({
      where: {
        courseId: courseId,
        rating: rating ?? undefined,
        AND: [
          {
            review: {
              not: null
            },
            ...(search.trim().length > 0 && {
              OR: Array.from(new Set(search.trim().split(' '))).map((word) => ({
                review: {
                  contains: word,
                  not: null
                }
              }))
            })
          }
        ]
      }
    });
  }
  async createReview(
    userId: number,
    courseId: number,
    rating: number,
    review: string
  ) {
    return this.prisma.review.create({
      data: {
        userId,
        courseId,
        rating,
        review: review.trim() ? review : null
      }
    });
  }

  async updateReview(reviewId: number, rating: number, review: string) {
    return this.prisma.review.update({
      where: {
        reviewId: reviewId
      },
      data: {
        rating,
        review: review.trim() ? review : null
      }
    });
  }
  async deleteReview(reviewId: number) {
    return this.prisma.review.delete({
      where: {
        reviewId: reviewId
      }
    });
  }
  async getReviewByUserIdAndCourseId(userId: number, courseId: number) {
    return this.prisma.review.findFirst({
      where: {
        userId,
        courseId
      },
      include: {
        User: {
          select: {
            name: true,
            img: true,
            isActive: true,
            isDeleted: true
          }
        }
      }
    });
  }
}
