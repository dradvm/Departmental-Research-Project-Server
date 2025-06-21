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

  @IsDefined()
  @ValidateIf((obj: ItemCartType) => obj.couponId !== null)
  @IsNumber()
  couponId: number | null;
}

export class PaymentCreateDto {
  @IsNumber()
  userId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemCartType)
  itemCart: ItemCartType[];

  @IsNumber()
  totalPrice: number;

  @IsNumber()
  final_price: number;
}
