import { IsBoolean } from 'class-validator';

export class TrackStudyCompleteDto {
  @IsBoolean()
  isDone: boolean;
}
