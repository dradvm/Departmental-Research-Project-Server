import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNumber,
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

export class PaymentOutputType {
  @IsString()
  paymentId: string;

  @IsString()
  timePayment: string;

  @IsString()
  userId: string;

  @ValidateIf((o: PaymentOutputType) => o.userName !== null)
  @IsString()
  userName: string | null;

  @ValidateIf((o: PaymentOutputType) => o.couponId !== null)
  @IsString()
  couponId: string | null;

  @ValidateIf((o: PaymentOutputType) => o.code !== null)
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

export class PaymentOutputRespone {
  @IsDefined()
  @ValidateNested({ each: true })
  @Type(() => PaymentOutputType)
  payments: PaymentOutputType[];

  @IsNumber()
  length: number;
}
