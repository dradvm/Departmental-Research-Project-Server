
import { Injectable } from '@nestjs/common';
import { UsersService } from '../modules/user/users.service'
import { comparePasswordHelper } from 'src/helpers/util';
import { JwtService } from '@nestjs/jwt';
import { CodeAuthDto, CreateAuthDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) { }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(username);
    if (!user) return null;
    const isValidPassword = await comparePasswordHelper(pass, user.password ?? '')
    if (!isValidPassword) return null;
    return user;
  }

  async login(user: any) {
    const payload = { username: user.email, sub: user.userId };
    return {
      user: {
        email: user.email,
        userId: user.userId,
        name: user.name,
        image: user.img,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async handleRegister(registerDto: CreateAuthDto) {
    return this.usersService.handleRegister(registerDto);
  }

  async checkCode(data: CodeAuthDto) {
    return this.usersService.handleActive(data);
  }

  async retryActive(data: string) {
    return this.usersService.retryActive(data);
  }
}
