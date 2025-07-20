import { IsNotEmpty, IsOptional } from 'class-validator';
import { CreateSectionDto } from './create-section.dto';

export class CreateCourseDto {
    @IsNotEmpty()
    userId: number;
    @IsNotEmpty()
    title: string;
    @IsOptional()
    subTitle?: string;
    @IsOptional()
    description?: string;
    @IsOptional()
    requirement?: string;
    @IsOptional()
    targetAudience: string;
    @IsNotEmpty()
    price: number;
    @IsOptional()
    isPublic?: boolean;
    @IsNotEmpty()
    sections: CreateSectionDto[];
    categoryIds: number[]; //
}
