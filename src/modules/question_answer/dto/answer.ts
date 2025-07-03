import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAnswerDTO {
  @IsNotEmpty()
  answerContent: string;

  @IsInt()
  @Type(() => Number)
  questionId: number;
}

export class UpdateAnswerDTO {
  @IsInt()
  @Type(() => Number)
  answerId: number;

  @IsNotEmpty()
  answerContent: string;

  @IsOptional()
  @IsString({ each: true })
  oldImages?: string[];
}
