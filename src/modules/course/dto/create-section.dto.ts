import { IsOptional } from 'class-validator';
import { CreateLectureDto } from './create-lecture.dto';

export class CreateSectionDto {
    nameSection: string;
    @IsOptional()
    order?: number;
    lectures: CreateLectureDto[];
}
