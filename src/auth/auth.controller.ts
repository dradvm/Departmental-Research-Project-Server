import { Controller, Post, UseGuards, Req, Body, Get, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { Public, ResponseMessage } from 'src/decorator/customize';
import { ChangePasswordAuthDto, CodeAuthDto, CreateAuthDto } from './dto/create-auth.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { TransformInterceptor } from './core/transform.interceptor';

@UseInterceptors(TransformInterceptor)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailerService: MailerService
  ) { }

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @ResponseMessage('fetch login')
  handleLogin(@Req() req: Request) {
    return this.authService.login(req.user);
  }

  //@UseGuards(JwtAuthGuard)
  @Post('register')
  @Public()
  register(@Body() registerDto: CreateAuthDto) {
    return this.authService.handleRegister(registerDto);
  }

  @Post('check-code')
  @Public()
  checkCode(@Body() registerDto: CodeAuthDto) {
    return this.authService.checkCode(registerDto);
  }

  @Post('retry-active')
  @Public()
  retryActive(@Body('email') email: string) {
    return this.authService.retryActive(email);
  }

  @Post('retry-password')
  @Public()
  retryPassword(@Body('email') email: string) {
    return this.authService.retryPassword(email);
  }

  @Post('change-password')
  @Public()
  changePassword(@Body() data: ChangePasswordAuthDto) {
    return this.authService.changePassword(data);
  }

  @Get('mail')
  @Public()
  testMail() {
    this.mailerService.sendMail({
      to: 'thntqt2908@gmail.com', // list of receivers
      subject: 'Testing Nest MailerModule ✔', // Subject line
      text: 'welcome', // plaintext body
      template: 'register.hbs', //file html
      context: {
        name: 'Nhuw',
        activationCode: 123456789
      }
    });
    return 'ok';
  }


}
