import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsNumber,
  ValidateIf,
  ValidateNested
} from 'class-validator';

export class ItemCartType {
  @IsDefined()
  @IsNumber()
  courseId: number;
}

export class PaymentCreateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemCartType)
  itemCart: ItemCartType[];

  @IsNumber()
  originalPrice: number;

  @IsNumber()
  totalPrice: number;

  @ValidateIf((o: PaymentCreateDto) => o.couponId !== null)
  @IsNumber()
  couponId: number | null;

  @IsNumber()
  finalPrice: number;
}
