import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { ApiRequestData } from 'src/common/base/api.request';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get('')
  getWishlist(@Req() req: ApiRequestData, @Query('search') search: string) {
    return this.wishlistService.getWishlist(req.user.userId, search);
  }

  @Post('')
  addWishlist(@Req() req: ApiRequestData, @Body() body: { courseId: number }) {
    return this.wishlistService.addWishlist(req.user.userId, body.courseId);
  }
  @Delete('/:courseId')
  removeWishlist(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: ApiRequestData
  ) {
    return this.wishlistService.deleteWishlist(req.user.userId, courseId);
  }
}
