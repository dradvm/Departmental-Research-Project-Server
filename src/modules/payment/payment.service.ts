import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentCreateDto } from './dto/create-payment';
import {
  Cart,
  Coupon,
  CouponCourse,
  Course,
  Payment,
  PaymentDetail
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { CouponCourseService } from '../coupon_course/couponcourse.service';
import { CouponService } from '../coupon/coupon.service';
import { CartService } from '../cart/cart.service';
import { PaymentDetailService } from '../payment_detail/paymentdetail.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private readonly couponCourseService: CouponCourseService,
    private readonly couponService: CouponService,
    private readonly cartService: CartService,
    private readonly paymentDetailService: PaymentDetailService
  ) {}

  async addOnePayment(data: PaymentCreateDto): Promise<Payment | null> {
    return await this.prisma.$transaction(async (tx) => {
      // check if cart is empty
      if (!data.itemCart.length)
        throw new BadRequestException(
          `itemCart is emtpy => can not create payment`
        );
      // create inital payment with userId and timePayment
      const payment = await tx.payment.create({
        data: {
          userId: data.userId,
          couponId: null,
          totalPrice: Decimal(data.totalPrice),
          final_price: Decimal(data.final_price),
          timePayment: new Date()
        }
      });
      // handle each course in cart
      for (const item of data.itemCart) {
        // if course is not exist => cancel
        const course: Course | null = await tx.course.findUnique({
          where: {
            courseId: item.courseId
          }
        });

        if (!course)
          throw new BadRequestException(
            `Can not find course => can not create payment detail`
          );

        // if course is not in cart => cancel
        const cart: Cart | null = await tx.cart.findUnique({
          where: {
            userId_courseId: {
              userId: payment.userId,
              courseId: item.courseId
            }
          }
        });

        if (!cart)
          throw new BadRequestException(
            `Course is not in cart => can not create payment detail`
          );

        // Create new paymenmt detail
        // Default: Can not use coupon
        const paymentDetail: PaymentDetail = {
          paymentId: payment.paymentId,
          courseId: course.courseId,
          price: course.price,
          final_price: course.price,
          couponId: null
        };

        const couponcourse: CouponCourse | null =
          await this.couponCourseService.getIsRunningCouponOfCourse(
            item.courseId,
            tx
          );

        const coupon: Coupon | null = couponcourse
          ? await this.couponService.getCouponById(couponcourse.couponId, tx)
          : null;

        if (coupon) {
          // handle for final price
          let savingAmount = new Decimal(0);
          // check if coupon is valid: time and quantity
          const now = new Date();
          if (
            coupon.startDate < now &&
            now < coupon.endDate &&
            coupon.appliedAmount < coupon.quantity &&
            coupon.minRequire.lte(course.price)
          ) {
            // discount: %
            if (coupon.type === 'discount')
              savingAmount = paymentDetail.price
                .mul(coupon.value)
                .div(new Decimal(100));
            // voucher
            else if (coupon.type === 'voucher') savingAmount = coupon.value;

            if (savingAmount.gt(coupon.maxValueDiscount))
              savingAmount = coupon.maxValueDiscount;

            // applied coupon => increase appliedAmount
            await tx.coupon.update({
              where: { couponId: coupon.couponId },
              data: {
                appliedAmount: coupon.appliedAmount + 1
              }
            });
          }
          paymentDetail.couponId = coupon.couponId;
          paymentDetail.final_price = paymentDetail.price.sub(savingAmount);
          if (paymentDetail.final_price.lt(0))
            paymentDetail.final_price = new Decimal(0);
        }
        const savedPaymentDetail: PaymentDetail = await tx.paymentDetail.create(
          { data: paymentDetail }
        );
        // delete course from cart
        const deleteItemFormCart: Cart =
          await this.cartService.removeOneCourseFromCart(
            payment.userId,
            course.courseId,
            tx
          );
        if (!deleteItemFormCart)
          throw new BadRequestException(
            `Can not remove course ${course.courseId} from cart of user ${payment.userId}`
          );
        console.log(savedPaymentDetail);
      }
      // calculate totalPrice and final_price in DB
      const figure: { totalPrice: Decimal; final_price: Decimal } =
        await this.paymentDetailService.getTotalPriceOfOnePayment(
          payment.paymentId,
          tx
        );
      // compare them with totalPrice and final_price from FE
      console.log(
        `FE: totalPrice: ${data.totalPrice}; final_price: ${data.final_price}`
      );
      console.log(
        `BE: totalPrice: ${figure.totalPrice.toString()}; final_price: ${figure.final_price.toString()}`
      );
      if (
        !figure.totalPrice.equals(new Decimal(data.totalPrice)) ||
        !figure.final_price.equals(new Decimal(data.final_price))
      )
        throw new BadRequestException(
          `totalPrice and final_price are different between FE and BE`
        );
      return payment;
    });
  }

  async getAllPayment(userId?: number): Promise<any[]> {
    try {
      const data = await this.prisma.payment.findMany({
        where: userId ? { userId } : {},
        include: {
          PaymentDetail: {
            include: {
              Course: true
            }
          },
          User: true
        }
      });
      const result = data.map((da) => {
        return {
          paymentId: da.paymentId,
          timePayment: da.timePayment,
          totalPrice: da.totalPrice,
          userId: da.userId,
          userName: da.User?.name,
          courseAmount: da.PaymentDetail.length,
          PaymentDetail: da.PaymentDetail.map((pay) => ({
            courseId: pay.courseId,
            price: pay.price,
            originalPrice: pay.Course.price,
            courseTitle: pay.Course.title,
            courseThumbnail: pay.Course.thumbnail
          }))
        };
      });
      return result;
    } catch (e) {
      throw new BadRequestException(`Can not get all payment: ${e}`);
    }
  }

  async getPaymentCountAndCost(userId?: number): Promise<{
    totalPrice: number;
    paymentCount: number;
  }> {
    const data = await this.prisma.payment.aggregate({
      where: userId ? { userId } : {},
      _sum: { totalPrice: true },
      _count: true
    });
    return {
      totalPrice: Number(data._sum.totalPrice ?? 0),
      paymentCount: data._count
    };
  }
}
