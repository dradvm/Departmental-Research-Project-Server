import { IsString, IsNotEmpty, IsEmail, MinLength } from "class-validator";

export class AuthRequest {

    @IsString({ message: 'Email phải là một chuỗi' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email: string;

    @IsString({ message: 'Mật khẩu phải là một chuỗi' })
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    password: string;

}