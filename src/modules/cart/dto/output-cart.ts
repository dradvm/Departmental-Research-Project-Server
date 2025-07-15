import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  IsString,
  ValidateIf,
  ValidateNested
} from 'class-validator';

class CourseInCart {
  @IsDefined()
  @IsString()
  courseId: string;

  @IsDefined()
  @ValidateIf((o: CourseInCart) => o.title !== null)
  @IsString()
  title: string | null;

  @IsDefined()
  @IsString()
  price: string;

  @IsDefined()
  @IsString()
  final_price: string;

  @IsDefined()
  @ValidateIf((o: CourseInCart) => o.thumbnail !== null)
  @IsString()
  thumbnail: string | null;
}

class TeacherInCart {
  @IsDefined()
  @IsString()
  userId: string | null;

  @IsDefined()
  @ValidateIf((o: TeacherInCart) => o.userName !== null)
  @IsString()
  userName: string | null;
}

export class Item {
  @ValidateNested()
  @Type(() => CourseInCart)
  course: CourseInCart;

  @ValidateNested()
  @Type(() => TeacherInCart)
  teacher: TeacherInCart;
}

export class CartOutputDto {
  @ValidateNested({ each: true })
  @Type(() => Item)
  items: Item[];

  @IsString()
  originalPrice: string;

  @IsString()
  totalPrice: string;

  @ValidateIf((o: CartOutputDto) => o.couponId !== null)
  @IsString()
  couponId: string | null;

  @IsString()
  finalPrice: string;

  @IsString()
  message: string;

  @IsBoolean()
  success: boolean;
}
