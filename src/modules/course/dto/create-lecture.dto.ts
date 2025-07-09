import { IsOptional } from "class-validator";

export class CreateLectureDto {
    nameLecture: string;
    @IsOptional()
    order?: number;
    @IsOptional()
    time?: number;
}
