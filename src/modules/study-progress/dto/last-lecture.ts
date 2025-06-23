import { IsInt } from 'class-validator';

export class LastLectureDto {
  @IsInt()
  lectureId: number;
}
