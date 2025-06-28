import { Controller, Post } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { StripeService } from '../stripe/stripe.service';

@Controller('/test')
export class TestController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly stripeService: StripeService
  ) {}

  @Post('/delete')
  async Test() {
    return this.cloudinaryService.deleteImage('s54ttz3ucuycyebviyzn');
  }
}
