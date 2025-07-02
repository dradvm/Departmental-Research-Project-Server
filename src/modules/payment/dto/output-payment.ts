import { Type } from 'class-transformer';
import {
  IsDefined,
  IsString,
  ValidateIf,
  ValidateNested
} from 'class-validator';

class PaymentDetailType {
  @IsDefined()
  @IsString()
  courseId: string;

  @IsDefined()
  @ValidateIf((o: PaymentDetailType) => o.courseThumbnail !== null)
  @IsString()
  courseThumbnail: string | null;

  @IsDefined()
  @ValidateIf((o: PaymentDetailType) => o.courseTitle !== null)
  @IsString()
  courseTitle: string | null;

  @IsDefined()
  @IsString()
  price: string;

  @IsDefined()
  @IsString()
  finalPrice: string;
}

export class PaymentOutputDto {
  @IsString()
  paymentId: string;

  @IsString()
  timePayment: string;

  @IsString()
  userId: string;

  @ValidateIf((o: PaymentOutputDto) => o.userName !== null)
  @IsString()
  userName: string | null;

  @ValidateIf((o: PaymentOutputDto) => o.couponId !== null)
  @IsString()
  couponId: string | null;

  @ValidateIf((o: PaymentOutputDto) => o.code !== null)
  @IsString()
  code: string | null;

  @IsString()
  originalPrice: string;

  @IsString()
  totalPrice: string;

  @IsString()
  finalPrice: string;

  @IsDefined()
  @ValidateNested({ each: true })
  @Type(() => PaymentDetailType)
  paymentDetail: PaymentDetailType[];
}
