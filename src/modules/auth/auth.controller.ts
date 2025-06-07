import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRequest } from './auth.request.dto';
import { ValidationPipe } from 'src/pipes/validation.pipe';
import { AuthGuard } from '@nestjs/passport';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('/login')
  login(@Body(new ValidationPipe()) request: AuthRequest): unknown {
    try {
      return this.authService.authenticate(request);
    } catch (error) {
      console.error('Errors:', error);
    }
  }
}
