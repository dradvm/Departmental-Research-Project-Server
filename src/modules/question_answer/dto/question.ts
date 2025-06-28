import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateQuestionDTO {
  @IsNotEmpty()
  questionTitle: string;

  @IsOptional()
  questionContent: string;

  @IsNotEmpty()
  lectureId: number;
}
