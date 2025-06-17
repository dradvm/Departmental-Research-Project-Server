import { BadRequestException, Injectable } from '@nestjs/common';
import { UserCoupon } from '@prisma/client';
import { UserCouponCreateDto } from './dto/create-usercoupon';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserCouponService {
  constructor(private prisma: PrismaService) {}

  async addOneCoupon(data: UserCouponCreateDto): Promise<UserCoupon> {
    try {
      return this.prisma.userCoupon.create({ data });
    } catch (e) {
      throw new BadRequestException(`
        Can not create this coupon for user: ${e}
      `);
    }
  }

  async getAllCouponOfUser(userId: number): Promise<UserCoupon[]> {
    try {
      return await this.prisma.userCoupon.findMany({
        where: {
          userId: userId
        }
      });
    } catch (e) {
      throw new BadRequestException(`
        Can not get all coupons of user ${userId}: ${e}
      `);
    }
  }
}
