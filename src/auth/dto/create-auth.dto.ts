import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateAuthDto {
  @IsString({ message: 'Email phải là một chuỗi' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là một chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @IsNotEmpty({ message: 'Name không được để trống' })
  @IsString({ message: 'Name phải là một chuỗi' })
  @MinLength(2, { message: 'Name phải có ít nhất 2 ký tự' })
  name: string;

  @IsNotEmpty({ message: 'Giới tính không được để trống' })
  gender: string;
}

export class CodeAuthDto {
  @IsNotEmpty({ message: 'Id không được để trống' })
  userId: string;

  @IsNotEmpty({ message: 'Code không được để trống' })
  code: string;
}

export class ChangePasswordAuthDto {
  @IsNotEmpty({ message: 'Code không được để trống' })
  code: string;

  @IsNotEmpty({ message: 'Password không được để trống' })
  password: string;

  @IsNotEmpty({ message: 'ConfirmPassword không được để trống' })
  confirmPassword: string;

  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;
}
