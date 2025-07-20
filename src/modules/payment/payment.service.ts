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
import { PaymentOutputRespone, PaymentOutputType } from './dto/output-payment';
import { getFinalPrice } from 'src/helpers/calculate-discount-amount';
import { MessageService } from '../message/message.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private readonly couponCourseService: CouponCourseService,
    private readonly couponService: CouponService,
    private readonly cartService: CartService,
    private readonly paymentDetailService: PaymentDetailService,
    private readonly messageService: MessageService
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
          const finalPiceOfCourse: Decimal = getFinalPrice(
            coupon,
            paymentDetail.price,
            false
          );
          if (!paymentDetail.price.equals(finalPiceOfCourse)) {
            paymentDetail.couponId = coupon.couponId;
            paymentDetail.final_price = finalPiceOfCourse;
            // applied coupon => increase appliedAmount
            await tx.coupon.update({
              where: { couponId: coupon.couponId },
              data: {
                appliedAmount: coupon.appliedAmount + 1
              }
            });
          }
        }
        // create paymentDetial
        await tx.paymentDetail.create({ data: paymentDetail });
        await this.messageService.addMessage(
          course.userId ?? 0,
          payment.userId,
          `Chào mừng bạn đến với khóa học "${course.title}". Chúc bạn có trải nghiệm học tập tốt nhất!`,
          null
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
          const finalPriceOfCart: Decimal = getFinalPrice(
            globalCoupon,
            figure.totalPrice,
            true
          );
          if (!finalPriceOfCart.equals(figure.totalPrice)) {
            payment.couponId = globalCoupon.couponId;
            payment.final_price = finalPriceOfCart;
            // applied globalCoupon => increase appliedAmount
            await tx.coupon.update({
              where: { couponId: globalCoupon.couponId },
              data: {
                appliedAmount: globalCoupon.appliedAmount + 1
              }
            });
          }
        }
      }
      // compare them with totalPrice and totalPrice and finalPrice from FE
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
    userId?: number,
    startDate?: string,
    endDate?: string,
    minPrice?: Decimal,
    maxPrice?: Decimal,
    userName?: string
  ): Promise<PaymentOutputRespone> {
    try {
      const where = {
        userId: userId || undefined,
        ...(startDate || endDate
          ? {
              timePayment: {
                ...(startDate && { gte: new Date(startDate) }),
                ...(endDate && {
                  lt: (() => {
                    const end = new Date(endDate);
                    end.setDate(end.getDate() + 1);
                    return end;
                  })()
                })
              }
            }
          : {}),
        ...(minPrice || maxPrice
          ? {
              final_price: {
                ...(minPrice && { gte: minPrice }),
                ...(maxPrice && { lte: maxPrice })
              }
            }
          : {}),
        ...(userName
          ? {
              User: {
                name: {
                  contains: userName.toLowerCase()
                }
              }
            }
          : {})
      };
      const data = await this.prisma.payment.findMany({
        where: where,
        skip: skip,
        take: limit,
        include: {
          PaymentDetail: {
            include: {
              Course: true
            }
          },
          User: true,
          Coupon: true
        }
      });
      const dataLength = (await this.prisma.payment.findMany({ where: where }))
        .length;
      const result: PaymentOutputType[] = await Promise.all(
        data.map(async (da) => {
          const figure: { originalPrice: Decimal; totalPrice: Decimal } =
            await this.paymentDetailService.getTotalPriceOfOnePayment(
              da.paymentId
            );
          return {
            paymentId: da.paymentId.toString(),
            timePayment: da.timePayment.toISOString(),
            originalPrice: figure.originalPrice.toString(),
            totalPrice: figure.totalPrice.toString(),
            couponId: da.couponId ? da.couponId?.toString() : null,
            code: da.Coupon ? da.Coupon.code : null,
            finalPrice: da.final_price.toString(),
            userId: da.userId.toString(),
            userName: da.User?.name ?? null,
            paymentDetail: da.PaymentDetail.map((pay) => ({
              courseId: pay.courseId.toString(),
              price: pay.price.toString(),
              finalPrice: pay.final_price.toString(),
              courseTitle: pay.Course.title,
              courseThumbnail: pay.Course.thumbnail
            }))
          };
        })
      );
      return {
        payments: result,
        length: dataLength
      };
    } catch (e) {
      throw new BadRequestException(`Can not get all payment: ${e}`);
    }
  }

  async getRevenueByMonths() {
    const report: { month: number; revenue: Decimal; count: number }[] = [];
    for (let i = 0; i <= 11; i++)
      report.push({
        month: i,
        revenue: new Decimal(0),
        count: 0
      });
    const data = await this.prisma.payment.findMany({
      select: {
        timePayment: true,
        final_price: true
      }
    });
    data.forEach((da) => {
      const month: number = da.timePayment.getMonth();
      report[month].revenue = report[month].revenue.add(da.final_price);
      report[month].count++;
    });
    return report.map((re) => ({
      name: `Tháng ${re.month + 1}`,
      month: re.month + 1,
      revenue: Number(re.revenue),
      count: re.count
    }));
  }
}
