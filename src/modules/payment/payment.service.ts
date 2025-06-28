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
import { PaymentOutputDto } from './dto/output-payment';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private readonly couponCourseService: CouponCourseService,
    private readonly couponService: CouponService,
    private readonly cartService: CartService,
    private readonly paymentDetailService: PaymentDetailService
  ) {}

  async addOnePayment(
    data: PaymentCreateDto,
    userId: number
  ): Promise<Payment | null> {
    return await this.prisma.$transaction(async (tx) => {
      // check if cart is empty
      if (!data.itemCart.length)
        throw new BadRequestException(
          `itemCart is emtpy => can not create payment`
        );
      // create inital payment with userId and timePayment
      const payment = await tx.payment.create({
        data: {
          userId: userId,
          couponId: null,
          originalPrice: Decimal(data.originalPrice),
          totalPrice: Decimal(data.totalPrice),
          final_price: Decimal(data.totalPrice),
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
      // calculate originalPrice and totalPrice in DB
      const figure: { originalPrice: Decimal; totalPrice: Decimal } =
        await this.paymentDetailService.getTotalPriceOfOnePayment(
          payment.paymentId,
          tx
        );

      // apply global coupon
      if (data.couponId) {
        const globalCoupon: Coupon | null =
          await this.couponService.getCouponById(data.couponId);
        if (globalCoupon) {
          // handle for final price
          let savingAmount = new Decimal(0);
          // check if coupon is valid: time and quantity
          const now = new Date();
          if (
            globalCoupon.startDate < now &&
            now < globalCoupon.endDate &&
            globalCoupon.appliedAmount < globalCoupon.quantity &&
            globalCoupon.minRequire.lte(figure.totalPrice)
          ) {
            // discount: %
            if (globalCoupon.type === 'discount')
              savingAmount = figure.totalPrice
                .mul(globalCoupon.value)
                .div(new Decimal(100));
            // voucher
            else if (globalCoupon.type === 'voucher')
              savingAmount = globalCoupon.value;

            if (savingAmount.gt(globalCoupon.maxValueDiscount))
              savingAmount = globalCoupon.maxValueDiscount;

            // applied globalCoupon => increase appliedAmount
            await tx.coupon.update({
              where: { couponId: globalCoupon.couponId },
              data: {
                appliedAmount: globalCoupon.appliedAmount + 1
              }
            });
            payment.couponId = globalCoupon.couponId;
            payment.final_price = payment.final_price.sub(savingAmount);
            if (payment.final_price.lt(0)) payment.final_price = new Decimal(0);
          }
        }
      }
      // compare them with totalPrice and totalPrice and finalPrice from FE
      console.log(
        `FE: originalPrice: ${data.originalPrice} totalPrice: ${data.totalPrice}; final_price: ${data.finalPrice}`
      );
      console.log(
        `BE: originalPrice: ${figure.originalPrice.toString()} totalPrice: ${figure.totalPrice.toString()}; final_price: ${payment.final_price.toString()}`
      );
      if (
        !figure.originalPrice.equals(new Decimal(data.originalPrice)) ||
        !figure.totalPrice.equals(new Decimal(data.totalPrice)) ||
        !payment.final_price.equals(new Decimal(data.finalPrice))
      )
        throw new BadRequestException(
          `totalPrice and final_price and originalPrice are different between FE and BE`
        );
      return await tx.payment.update({
        where: {
          paymentId: payment.paymentId
        },
        data: payment
      });
    });
  }

  async getAllPayment(
    limit: number,
    skip: number,
    userId?: number
  ): Promise<PaymentOutputDto[]> {
    try {
      const data = await this.prisma.payment.findMany({
        where: userId ? { userId } : {},
        skip: skip,
        take: limit,
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
          paymentId: da.paymentId.toString(),
          timePayment: da.timePayment.toISOString(),
          totalPrice: da.totalPrice.toString(),
          couponId: da.couponId ? da.couponId?.toString() : null,
          final_price: da.final_price.toString(),
          userId: da.userId.toString(),
          userName: da.User?.name ?? null,
          paymentDetail: da.PaymentDetail.map((pay) => ({
            courseId: pay.courseId.toString(),
            price: pay.price.toString(),
            final_price: pay.final_price.toString(),
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
}
