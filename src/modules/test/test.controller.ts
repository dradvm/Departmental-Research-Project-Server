import { Controller, Get, Post } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('/test')
export class TestController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly stripeService: StripeService,
    private readonly prismaService: PrismaService
  ) {}
  @Get('')
  async test() {
    return this.prismaService.question.findMany({
      include: {
        QuestionImage: true
      }
    });
  }

  @Post('/delete')
  async Test() {
    return this.cloudinaryService.deleteImage('s54ttz3ucuycyebviyzn');
  }
}
