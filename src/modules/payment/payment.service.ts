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
import { EnrollmentService } from '../enrollment/enrollment.service';
import { StudyProgressService } from '../study-progress/study-progress.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private readonly couponCourseService: CouponCourseService,
    private readonly couponService: CouponService,
    private readonly cartService: CartService,
    private readonly paymentDetailService: PaymentDetailService,
    private readonly messageService: MessageService,
    private readonly enrollmentService: EnrollmentService,
    private readonly studyProgressService: StudyProgressService
  ) {}

  async addOnePayment(
    data: PaymentCreateDto,
    userId: number
  ): Promise<Payment | null> {
    if (!data.itemCart.length)
      throw new BadRequestException(
        `itemCart is empty => cannot create payment`
      );

    // Will hold logic to execute after transaction
    const postTransactionTasks: (() => Promise<void>)[] = [];

    return await this.prisma
      .$transaction(
        async (tx) => {
          // Step 1: Create initial payment
          const payment = await tx.payment.create({
            data: {
              userId,
              couponId: null,
              final_price: new Decimal(data.totalPrice),
              timePayment: new Date()
            }
          });

          for (const item of data.itemCart) {
            // Step 2: Validate course
            const course = await tx.course.findUnique({
              where: { courseId: item.courseId }
            });
            if (!course)
              throw new BadRequestException(
                `Cannot find course ${item.courseId} => cannot create payment detail`
              );

            // Step 3: Check if course is in cart
            const cart = await tx.cart.findUnique({
              where: {
                userId_courseId: {
                  userId: payment.userId,
                  courseId: item.courseId
                }
              }
            });
            if (!cart)
              throw new BadRequestException(
                `Course ${item.courseId} is not in cart => cannot create payment detail`
              );

            // Step 4: Prepare payment detail
            const paymentDetail: PaymentDetail = {
              paymentId: payment.paymentId,
              courseId: course.courseId,
              price: course.price,
              final_price: course.price,
              couponId: null
            };

            // Step 5: Apply coupon if any
            const couponcourse =
              await this.couponCourseService.getIsRunningCouponOfCourse(
                item.courseId,
                tx
              );
            const coupon = couponcourse
              ? await this.couponService.getCouponById(
                  couponcourse.couponId,
                  tx
                )
              : null;

            if (coupon) {
              const finalPrice = getFinalPrice(
                coupon,
                paymentDetail.price,
                false
              );
              if (!paymentDetail.price.equals(finalPrice)) {
                paymentDetail.couponId = coupon.couponId;
                paymentDetail.final_price = finalPrice;
                await tx.coupon.update({
                  where: { couponId: coupon.couponId },
                  data: { appliedAmount: coupon.appliedAmount + 1 }
                });
              }
            }

            // Step 6: Create payment detail
            await tx.paymentDetail.create({ data: paymentDetail });

            // Step 7: Queue post-payment service logic (outside transaction)
            postTransactionTasks.push(async () => {
              await this.enrollmentService.addCourseEnroll(
                payment.userId,
                course.courseId
              );
              await this.studyProgressService.addAllStudyProgressUser(
                payment.userId,
                course.courseId
              );
              await this.studyProgressService.addLastLectureStudyInit(
                payment.userId,
                course.courseId
              );
              await this.messageService.addMessage(
                course.userId ?? 0,
                payment.userId,
                `Chào mừng bạn đến với khóa học "${course.title}". Chúc bạn có trải nghiệm học tập tốt nhất!`,
                null
              );
              const deleted = await this.cartService.removeOneCourseFromCart(
                payment.userId,
                course.courseId
              );
              if (!deleted) {
                throw new BadRequestException(
                  `Cannot remove course ${course.courseId} from cart of user ${payment.userId}`
                );
              }
            });
          }

          // Step 8: Compute total + original prices
          const figure =
            await this.paymentDetailService.getTotalPriceOfOnePayment(
              payment.paymentId,
              tx
            );

          // Step 9: Apply global coupon (if any)
          if (data.couponId) {
            const globalCoupon = await this.couponService.getCouponById(
              data.couponId
            );
            if (globalCoupon) {
              const finalPrice = getFinalPrice(
                globalCoupon,
                figure.totalPrice,
                true
              );
              if (!finalPrice.equals(figure.totalPrice)) {
                payment.couponId = globalCoupon.couponId;
                payment.final_price = finalPrice;
                await tx.coupon.update({
                  where: { couponId: globalCoupon.couponId },
                  data: { appliedAmount: globalCoupon.appliedAmount + 1 }
                });
              }
            }
          }

          // Step 10: Validate price integrity with FE
          if (
            !figure.originalPrice.equals(new Decimal(data.originalPrice)) ||
            !figure.totalPrice.equals(new Decimal(data.totalPrice)) ||
            !payment.final_price.equals(new Decimal(data.finalPrice))
          ) {
            throw new BadRequestException(`Price mismatch between FE and BE`);
          }

          // Step 11: Return updated payment (with coupon if any)
          return await tx.payment.update({
            where: { paymentId: payment.paymentId },
            data: payment
          });
        },
        {
          timeout: 60000 // 60 giây
        }
      )
      .then(async (result) => {
        // Run all post-transaction tasks
        for (const task of postTransactionTasks) {
          await task();
        }
        return result;
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
