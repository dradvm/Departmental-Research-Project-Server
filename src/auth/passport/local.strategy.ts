
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService) {
        super({
            usernameField: 'email', // thay vì username mặc định
            passwordField: 'password',
        });
    }

    async validate(username: string, password: string): Promise<any> {
        const user = await this.authService.validateUser(username, password);
        if (!user) {
            throw new UnauthorizedException("Username/Password không hợp lệ");
        }
        if (user.isActive === false) {
            throw new BadRequestException("Tài khoản chưa được kích hoạt")
        }
        return user;
    }
}
