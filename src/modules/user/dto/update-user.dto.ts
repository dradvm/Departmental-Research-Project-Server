import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsString, IsNotEmpty, IsEmail, MinLength, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';


export class UpdateUserDto {
    @Type(() => Number)
    @IsInt({ message: "id không hợp lệ" })
    @IsNotEmpty({ message: "id không được để trống" })
    id: bigint;

    @IsOptional()
    @IsString({ message: "Tên phải là chuỗi ký tự" })
    name?: string;

    @IsOptional()
    @IsString()
    biography?: string;

    @IsOptional()
    @IsString()
    img?: string;
}
