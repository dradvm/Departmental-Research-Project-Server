import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserCouponCreateDto } from './dto/create-usercoupon';
import { UserCoupon } from '@prisma/client';
import { UserCouponService } from './usercoupon.service';

@Controller('usercoupon')
export class UserCouponController {
  constructor(private readonly userCouponService: UserCouponService) {}

  @Post()
  async createCouponForUser(
    @Body() data: UserCouponCreateDto
  ): Promise<UserCoupon | null> {
    return await this.userCouponService.addOneCoupon(data);
  }

  @Get('/user/:userId')
  async getAllCouponForUser(
    @Param('userId') userId: string
  ): Promise<UserCoupon[]> {
    return await this.userCouponService.getAllCouponOfUser(parseInt(userId));
  }
}
