import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CouponCourseController } from './couponcourse.controller';
import { CouponCourseService } from './couponcourse.service';

@Module({
  imports: [PrismaModule],
  controllers: [CouponCourseController],
  providers: [CouponCourseService],
  exports: [CouponCourseService]
})
export class CouponCourseModule {}
