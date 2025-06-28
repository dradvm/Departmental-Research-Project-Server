import { Coupon } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// for both course and cart, input coupon and originalPrice and will receive a finalPrice
// but this function can not handle if the isGlobal field for cart is valid
export function getFinalPrice(
  coupon: Coupon | null,
  originalPrice: Decimal,
  shouldCheckGlobal: boolean
): Decimal {
  if (coupon) {
    let savingAmount = new Decimal(0);
    // check if coupon is valid: time and quantity
    const now = new Date();
    if (
      coupon.isGlobal === shouldCheckGlobal &&
      coupon.startDate < now &&
      now < coupon.endDate &&
      coupon.appliedAmount < coupon.quantity &&
      coupon.minRequire.lte(originalPrice)
    ) {
      // discount: %
      if (coupon.type === 'discount')
        savingAmount = originalPrice.mul(coupon.value).div(new Decimal(100));
      // voucher
      else if (coupon.type === 'voucher') savingAmount = coupon.value;

      if (savingAmount.gt(coupon.maxValueDiscount))
        savingAmount = coupon.maxValueDiscount;

      const finalPrice: Decimal = originalPrice.sub(savingAmount);
      if (finalPrice.lt(0)) return new Decimal(0);
      else return finalPrice;
    } else return originalPrice;
  } else return originalPrice;
}

interface HandleGlobalCouponType {
  success: boolean;
  message: string;
  final_price: Decimal;
  couponId: number | null;
}

// for cartService because this function will return the reason why user can not apply coupn
export function getFinalPriceOfCart(
  coupon: Coupon | null,
  totalPrice: Decimal
): HandleGlobalCouponType {
  const result: HandleGlobalCouponType = {
    success: false,
    message: 'Mã khuyến mãi không hợp lệ',
    final_price: totalPrice,
    couponId: null
  };

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
