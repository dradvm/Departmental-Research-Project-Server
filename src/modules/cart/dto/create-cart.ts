import { IsNumber } from 'class-validator';

export class CartCreateDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  courseId: number;
}
