import { Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Body, ValidationPipe } from '@nestjs/common';
import { AuthRequest } from './auth.request.dto';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  login(@Body(new ValidationPipe()) request: AuthRequest): unknown {
    try {
      return 1;
    } catch (error) {
      console.error('Errors:', error);
    }
  }
}
