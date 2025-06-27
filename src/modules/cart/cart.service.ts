import { BadRequestException, Injectable } from '@nestjs/common';
import { Cart, Coupon, CouponCourse, Prisma } from '@prisma/client';
import { CartCreateDto } from './dto/create-cart';
import { PrismaService } from 'src/prisma/prisma.service';
import { CouponCourseService } from '../coupon_course/couponcourse.service';
import { CartOutputDto, Item } from './dto/output-cart';
import { CouponService } from '../coupon/coupon.service';
import { Decimal } from '@prisma/client/runtime/library';

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

  async handleApplyGlobalCoupon(
    code: string,
    totalPrice: Decimal
  ): Promise<HandleGlobalCouponType> {
    const result: HandleGlobalCouponType = {
      success: false,
      message: 'Mã khuyến mãi không hợp lệ',
      final_price: totalPrice,
      couponId: null
    };

    const coupon = await this.couponService.getCouponByCode(code);
    if (!coupon) return result;
    // check coupon
    if (!coupon.isGlobal)
      return {
        ...result,
        message: 'Mã khuyến mãi bạn nhập chỉ dành riêng cho từng khóa học'
      };
    const now = new Date();
    if (coupon.startDate > now || now > coupon.endDate)
      return {
        ...result,
        message: 'Quá hoặc chưa tới thời gian khuyến mãi'
      };
    if (coupon.appliedAmount >= coupon.quantity)
      return {
        ...result,
        message: 'Đã hết lượt áp dụng khuyến mãi'
      };
    if (totalPrice.lt(coupon.minRequire))
      return {
        ...result,
        message: 'Tổng hóa đơn chưa đủ điều kiện để khuyến mãi'
      };
    // Apply coupon
    let savingAmount: Decimal = new Decimal(0);
    if (coupon.type === 'discount')
      savingAmount = totalPrice.mul(coupon.value).div(new Decimal(100));
    else if (coupon.type === 'voucher') savingAmount = coupon.value;

    if (savingAmount.gt(coupon.maxValueDiscount))
      savingAmount = coupon.maxValueDiscount;

    let final_price: Decimal = totalPrice.sub(savingAmount);
    final_price = final_price.gt(new Decimal(0)) ? final_price : new Decimal(0);
    return {
      success: true,
      message: 'Đã áp dụng mã khuyến mãi',
      final_price,
      couponId: coupon.couponId
    };
  }

  async addCourseIntoCart(data: CartCreateDto): Promise<Cart> {
    try {
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
      let originalPrice = new Decimal(0);
      let totalPrice = new Decimal(0);
      for (const cart of cartDB) {
        // handle coupon
        const couponcourse: CouponCourse | null =
          await this.couponCourseService.getIsRunningCouponOfCourse(
            cart.courseId
          );

        // use coupon
        let savingAmount = new Decimal(0);
        if (couponcourse) {
          const coupon: Coupon | null = await this.couponService.getCouponById(
            couponcourse.couponId
          );
          // handle final price
          // check if coupon is valid: time and quantity
          const now = new Date();
          if (
            coupon &&
            coupon.startDate < now &&
            now < coupon.endDate &&
            coupon.appliedAmount < coupon.quantity &&
            coupon.minRequire.lte(cart.Course.price)
          ) {
            // discount: %
            if (coupon.type === 'discount')
              savingAmount = cart.Course.price
                .mul(coupon.value)
                .div(new Decimal(100));
            else if (coupon.type === 'voucher') savingAmount = coupon.value;

            if (savingAmount.gt(coupon.maxValueDiscount))
              savingAmount = coupon.maxValueDiscount;
          }
        }
        let final_price: Decimal = cart.Course.price.sub(savingAmount);
        final_price = final_price.gt(new Decimal(0))
          ? final_price
          : new Decimal(0);

        items.push({
          course: {
            courseId: cart.courseId.toString(),
            title: cart.Course.title,
            price: cart.Course.price.toString(),
            final_price: final_price.toString(),
            thumbnail: cart.Course.thumbnail
          },
          teacher: {
            userId: cart.User.userId.toString(),
            userName: cart.User.name
          }
        });
        originalPrice = originalPrice.add(cart.Course.price);
        totalPrice = totalPrice.add(final_price);
      }
      // handle global coupon
      let appliedResult: HandleGlobalCouponType = {
        success: true,
        message: 'Không áp dụng mã khuyến mãi',
        final_price: totalPrice,
        couponId: null
      };
      if (code) {
        const result: HandleGlobalCouponType =
          await this.handleApplyGlobalCoupon(code, totalPrice);
        appliedResult = { ...result };
        console.log(result);
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
}
