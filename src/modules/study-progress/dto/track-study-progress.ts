import { IsInt } from 'class-validator';

export class TrackStudyProgressDto {
  @IsInt()
  seconds: number;
}
