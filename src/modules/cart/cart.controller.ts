import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CartCreateDto } from './dto/create-cart';
import { Cart } from '@prisma/client';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  async addCourse(@Body() data: CartCreateDto): Promise<Cart | null> {
    return await this.cartService.addCourseIntoCart(data);
  }

  @Get('/user/:userId')
  async getAllCourseInCart(@Param('userId') userId: string): Promise<any> {
    return await this.cartService.getAllCourseInCart(parseInt(userId));
  }

  @Delete('/user/:userId/course/:courseId')
  async deleteOneCourseFromCart(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string
  ): Promise<Cart> {
    return await this.cartService.removeOneCourseFromCart(
      parseInt(userId),
      parseInt(courseId)
    );
  }

  @Delete('/user/:userId')
  async deleteCartOfUser(
    @Param('userId') userId: string
  ): Promise<{ count: number }> {
    return this.cartService.removeAllCourseOfCart(parseInt(userId));
  }
}
