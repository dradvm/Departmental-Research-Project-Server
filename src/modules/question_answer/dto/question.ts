import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateQuestionDTO {
  @IsNotEmpty()
  questionTitle: string;

  @IsOptional()
  questionContent: string;

  @IsInt()
  @Type(() => Number)
  lectureId: number;
}

export class UpdateQuestionDTO extends PartialType(CreateQuestionDTO) {
  @IsInt()
  @Type(() => Number)
  questionId: number;

  @IsOptional()
  @IsString({ each: true })
  oldImages?: string[];
}
