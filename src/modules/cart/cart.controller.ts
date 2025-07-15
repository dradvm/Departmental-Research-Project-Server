import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { CartCreateDto } from './dto/create-cart';
import { Cart } from '@prisma/client';
import { CartService } from './cart.service';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { ApiRequestData } from 'src/common/base/api.request';
import { CartOutputDto } from './dto/output-cart';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async addCourse(
    @Req() req: ApiRequestData,
    @Body() body: { courseId: number }
  ): Promise<Cart | null> {
    const data: CartCreateDto = {
      userId: req.user.userId,
      courseId: body.courseId
    };
    return await this.cartService.addCourseIntoCart(data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('')
  async getAllCourseInCart(
    @Req() req: ApiRequestData,
    @Query('code') code?: string
  ): Promise<CartOutputDto> {
    return await this.cartService.getAllCourseInCart(req.user.userId, code);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:courseId')
  async deleteOneCourseFromCart(
    @Req() req: ApiRequestData,
    @Param('courseId') courseId: string
  ): Promise<Cart> {
    return await this.cartService.removeOneCourseFromCart(
      req.user.userId,
      parseInt(courseId)
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/delete/all/')
  async deleteCartOfUser(
    @Req() req: ApiRequestData
  ): Promise<{ count: number }> {
    return this.cartService.removeAllCourseOfCart(req.user.userId);
  }
}
