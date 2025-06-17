import { BadRequestException, Injectable } from '@nestjs/common';
import { Cart } from '@prisma/client';
import { CartCreateDto } from './dto/create-cart';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    private readonly paymentService: PaymentService
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
      const figure = await this.paymentService.getPaymentCountAndCost(
        userId ? userId : undefined
      );
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
      const result = {
        totalPrice: figure.totalPrice,
        paymentCount: figure.paymentCount,
        courses: cartDB.map((cart) => ({
          courseId: cart.courseId,
          title: cart.Course.title,
          price: cart.Course.price,
          thumbnail: cart.Course.thumbnail,
          Coupons: cart.Course.CouponCourse.map((cou) => ({
            ...cou.Coupon
          })),
          teacher: cart.Course.User
        }))
      };
      return result;
    } catch (e) {
      throw new BadRequestException(
        `Can not get all courses in cart of user ${userId}: ${e}`
      );
    }
  }

  async removeOneCourseFromCart(
    userId: number,
    coursedId: number
  ): Promise<Cart> {
    try {
      return this.prisma.cart.delete({
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
