import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateNoteDTO {
  @IsInt()
  @IsNotEmpty()
  timeNote: number;

  @IsString()
  @IsNotEmpty()
  note: string;

  @IsInt()
  @IsNotEmpty()
  lectureId: number;
}

export class UpdateNoteDTO {
  @IsInt()
  @IsNotEmpty()
  noteId: number;

  @IsString()
  @IsNotEmpty()
  note: string;
}
