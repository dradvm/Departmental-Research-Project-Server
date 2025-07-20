import { BadRequestException, Injectable } from '@nestjs/common';
import { Cart, Coupon, CouponCourse, Prisma } from '@prisma/client';
import { CartCreateDto } from './dto/create-cart';
import { PrismaService } from 'src/prisma/prisma.service';
import { CouponCourseService } from '../coupon_course/couponcourse.service';
import { CartOutputDto, Item } from './dto/output-cart';
import { CouponService } from '../coupon/coupon.service';
import { Decimal } from '@prisma/client/runtime/library';
import {
  getFinalPriceOfCart,
  getFinalPrice
} from 'src/helpers/calculate-discount-amount';

interface HandleGlobalCouponType {
  success: boolean;
  message: string;
  final_price: Decimal;
  couponId: number | null;
}

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    private readonly couponCourseService: CouponCourseService,
    private readonly couponService: CouponService
  ) {}

  async addCourseIntoCart(data: CartCreateDto): Promise<Cart> {
    try {
      try {
        await this.prisma.wishlist.delete({
          where: {
            userId_courseId: {
              userId: data.userId,
              courseId: data.courseId
            }
          }
        });
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (error.code !== 'P2025') throw error;
      }
      return this.prisma.cart.create({ data });
    } catch (e) {
      throw new BadRequestException(
        `Can not add this course into a cart: ${e}`
      );
    }
  }

  async getAllCourseInCart(
    userId: number,
    code?: string
  ): Promise<CartOutputDto> {
    try {
      const cartDB = await this.prisma.cart.findMany({
        where: {
          userId: userId
        },
        include: {
          User: true,
          Course: {
            include: {
              CouponCourse: {
                include: {
                  Coupon: true
                }
              },
              User: true
            }
          }
        }
      });
      const items: Item[] = [];
      // originalPrice and totalPrice below are cart's data, not course's data
      let originalPrice = new Decimal(0);
      let totalPrice = new Decimal(0);
      for (const cart of cartDB) {
        // handle coupon
        let final_price = cart.Course.price;
        const couponcourse: CouponCourse | null =
          await this.couponCourseService.getIsRunningCouponOfCourse(
            cart.courseId
          );
        if (couponcourse) {
          const coupon: Coupon | null = await this.couponService.getCouponById(
            couponcourse.couponId
          );
          final_price = getFinalPrice(coupon, cart.Course.price, false);
        }
        // push into array
        items.push({
          course: {
            courseId: cart.courseId.toString(),
            title: cart.Course.title,
            price: cart.Course.price.toString(),
            final_price: final_price.toString(),
            thumbnail: cart.Course.thumbnail
          },
          teacher: {
            userId: cart.Course.User?.userId.toString() || null,
            userName: cart.Course.User?.name || 'Không xác định'
          }
        });
        originalPrice = originalPrice.add(cart.Course.price);
        totalPrice = totalPrice.add(final_price);
      }
      // handle global coupon
      let appliedResult: HandleGlobalCouponType = {
        success: true,
        message: '',
        final_price: totalPrice,
        couponId: null
      };
      if (code) {
        const glonalCoupon: Coupon | null =
          await this.couponService.getCouponByCode(code);
        const result: HandleGlobalCouponType = getFinalPriceOfCart(
          glonalCoupon,
          totalPrice
        );
        appliedResult = { ...result };
      }
      return {
        items: items,
        originalPrice: originalPrice.toString(),
        totalPrice: totalPrice.toString(),
        couponId: appliedResult.couponId
          ? appliedResult.couponId.toString()
          : null,
        finalPrice: appliedResult.final_price.toString(),
        message: appliedResult.message,
        success: appliedResult.success
      };
    } catch (e) {
      throw new BadRequestException(
        `Can not get all courses in cart of user ${userId}: ${e}`
      );
    }
  }

  async removeOneCourseFromCart(
    userId: number,
    coursedId: number,
    tx?: Prisma.TransactionClient
  ): Promise<Cart> {
    try {
      const client = tx ?? this.prisma;
      return client.cart.delete({
        where: {
          userId_courseId: {
            userId: userId,
            courseId: coursedId
          }
        }
      });
    } catch (e) {
      throw new BadRequestException(
        `Can not delete course ${coursedId} from cart of user ${userId}: ${e}`
      );
    }
  }

  async removeAllCourseOfCart(userId: number): Promise<{ count: number }> {
    try {
      return await this.prisma.cart.deleteMany({
        where: {
          userId: userId
        }
      });
    } catch (e) {
      throw new BadRequestException(
        `Can not delete all courses from the cart of user ${userId}: ${e}`
      );
    }
  }
  getItemCourseInCart(userId: number, courseId: number) {
    if (!userId) {
      return null;
    }
    return this.prisma.cart.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId
        }
      }
    });
  }
}
