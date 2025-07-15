import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// use to filter global coupon and normal coupon by their value ? (discount: percent, voucher: price)

// This query is only used for Coupon Table
function getValueCondition(
  minPercent?: number,
  minPrice?: number
): Prisma.CouponWhereInput[] {
  let valueConditions: Prisma.CouponWhereInput[] = [];
  if (minPercent && minPrice)
    valueConditions = [
      {
        AND: [{ value: { gte: new Decimal(minPercent) } }, { type: 'discount' }]
      },
      {
        AND: [{ value: { gte: new Decimal(minPrice) } }, { type: 'voucher' }]
      }
    ];
  else if (minPercent)
    valueConditions = [
      {
        AND: [{ value: { gte: new Decimal(minPercent) } }, { type: 'discount' }]
      },
      { type: 'voucher' }
    ];
  else if (minPrice)
    valueConditions = [
      { type: 'discount' },
      {
        AND: [{ value: { gte: new Decimal(minPrice) } }, { type: 'voucher' }]
      }
    ];
  return valueConditions;
}

// support to query on CouponCourse Table
export function getWhereOfNormalCoupon(
  teacherId?: number,
  startDate?: string,
  endDate?: string,
  minPercent?: number,
  minPrice?: number,
  searchText?: string
) {
  const valueConditions: Prisma.CouponWhereInput[] = getValueCondition(
    minPercent,
    minPrice
  );
  const where = {
    Coupon: {
      isGlobal: false,
      ...(startDate
        ? {
            startDate: { gte: new Date(startDate) }
          }
        : {}),
      ...(endDate
        ? {
            endDate: {
              lt: (() => {
                const end = new Date(endDate);
                end.setDate(end.getDate() + 1);
                return end;
              })()
            }
          }
        : {}),
      ...(valueConditions.length > 0 && { OR: valueConditions })
    },
    Course: {
      User: {
        userId: teacherId
      }
    },
    ...(searchText
      ? {
          OR: [
            {
              Course: {
                User: {
                  name: {
                    contains: searchText.toLowerCase()
                  }
                }
              }
            },
            {
              Course: {
                title: {
                  contains: searchText.toLowerCase()
                }
              }
            }
          ]
        }
      : {}),
    isDeleted: false
  };
  return where;
}

// support to query on Coupon Table
export function getWhereOfGlobalCoupon(
  isGlobal: boolean,
  startDate?: string,
  endDate?: string,
  minPercent?: number,
  minPrice?: number
) {
  const valueConditions: Prisma.CouponWhereInput[] = getValueCondition(
    minPercent,
    minPrice
  );
  const where = {
    isGlobal: isGlobal,
    ...(startDate
      ? {
          startDate: { gte: new Date(startDate) }
        }
      : {}),
    ...(endDate
      ? {
          endDate: {
            lt: (() => {
              const end = new Date(endDate);
              end.setDate(end.getDate() + 1);
              return end;
            })()
          }
        }
      : {}),
    ...(valueConditions.length > 0 && { OR: valueConditions })
  };
  return where;
}
