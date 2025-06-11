import { Controller, Post, Body, UseGuards, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRequest } from './dto/auth-request.dto';
import { ValidationPipe } from 'src/pipes/validation.pipe';
import { ApiResponse, TApiResponse } from 'src/common/base/api.response';
import { ILoginResponse } from './auth.interface';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(
    @Body(new ValidationPipe()) request: AuthRequest
  ): Promise<TApiResponse<ILoginResponse>> {
    try {
      const response = await this.authService.authenticate(request);
      return ApiResponse.ok(response, 'Đăng nhập thành công', HttpStatus.OK);
    } catch (error) {
      return ApiResponse.error(
        error,
        'Có lỗi xảy ra trong quá trình đăng nhập',
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
