import { BadRequestException, Injectable } from '@nestjs/common';
import { Cart, Coupon, Prisma } from '@prisma/client';
import { CartCreateDto } from './dto/create-cart';
import { PrismaService } from 'src/prisma/prisma.service';
import { CouponCourseService } from '../coupon_course/couponcourse.service';

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    private readonly couponCourseService: CouponCourseService
  ) {}

  async addCourseIntoCart(data: CartCreateDto): Promise<Cart> {
    try {
      return this.prisma.cart.create({ data });
    } catch (e) {
      throw new BadRequestException(
        `Can not add this course into a cart: ${e}`
      );
    }
  }

  async getAllCourseInCart(userId: number): Promise<any> {
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
      const results: any[] = [];

      for (const cart of cartDB) {
        // handle coupon
        const couponcourse =
          await this.couponCourseService.getIsRunningCouponOfCourse(
            cart.courseId
          );

        // use coupon
        let savingAmount = 0;
        if (couponcourse) {
          const coupon: Coupon = couponcourse.Coupon;
          // handle final price
          // check if coupon is valid: time and quantity
          if (
            coupon.startDate < new Date() &&
            new Date() < coupon.endDate &&
            coupon.appliedAmount < coupon.quantity
          ) {
            // discount: %
            if (coupon.type === 'discount')
              savingAmount =
                (cart.Course.price.toNumber() * coupon.value.toNumber()) / 100;
            else if (coupon.type === 'voucher')
              savingAmount = coupon.value.toNumber();

            if (savingAmount > coupon.maxValueDiscount.toNumber())
              savingAmount = coupon.maxValueDiscount.toNumber();
          }
        }

        results.push({
          courseId: cart.courseId,
          title: cart.Course.title,
          price: cart.Course.price,
          final_price: Math.max(0, cart.Course.price.toNumber() - savingAmount),
          thumbnail: cart.Course.thumbnail,
          teacher: cart.Course.User
        });
      }
      return results;
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
}
