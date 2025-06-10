import { Injectable, InternalServerErrorException, UnauthorizedException, Inject, Logger } from '@nestjs/common';
import { AuthRequest } from './auth.request.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserWithoutPassword } from '../user/user.interface';
import { ILoginResponse, IJwtPayload, ITokenContext } from './auth.interface';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AuthService {

  //private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }
  //   async authenticate(request: AuthRequest): Promise<ILoginResponse> {
  //     try {
  //       return await this.createAuthContext(request);
  //     } catch (error) {
  //       if (error instanceof Error) {
  //         this.logger.error(`Lỗi trong quá trình xác thực ${error.message}`, error.stack);
  //       }
  //       if (error instanceof UnauthorizedException) {
  //         throw error;
  //       }
  //       throw new InternalServerErrorException('Có vấn đề xảy ra trong quá trình xác thực');
  //     }
  //   }

  // }

  // private async createAuthContext(resquest: AuthRequest): Promise < ITokenContext > {
  //   return{
  //     user: null;
  //     deviceId: this.generateDeviceId(request),
  //   }
  // }

  // private generateDeviceId(request: Request): string {
  //   const userAgent = request.headers['user-agent'] || 'unknown';
  //   const ip = request.ip || 'unknown';
  //   return Buffer.from(`${userAgent}-${ip}`).toString('base64');
  // }

  async authenticate(request: AuthRequest): Promise<ILoginResponse> {

    const user = await this.validateUser(request.email, request.password);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chinh xác');
    }

    const payload = { sub: user.idUser.toString() }
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = randomBytes(32).toString('hex');
    const crsfToken = randomBytes(32).toString('hex');
    //Lưu trữ refresh token vào redis để sau này so sánh

    const refreshTokenCacheData: { userId: string, expiresAt: number } = {
      userId: user.idUser.toString(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 ngày
    }

    await this.cacheManager.set(`refresh_token:${refreshToken}`, refreshTokenCacheData, 30 * 24 * 60 * 60);
    return this.authResponse(accessToken, crsfToken);

  }

  authResponse(accessToken: string, crsfToken: string): ILoginResponse {

    const decode = this.jwtService.decode<IJwtPayload>(accessToken);

    const expiresAt = decode.exp - Math.floor(Date.now() / 1000);

    return {
      accessToken: accessToken,
      expiresAt: expiresAt,
      tokenType: 'Bearer',
      crsfToken: crsfToken
    };

  }

  async validateUser(email: string, password: string): Promise<UserWithoutPassword | null> {
    const user = await this.prismaService.user.findUnique({
      where: { email }
    });
    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user; // Exclude password from the result
    return { ...result, idUser: BigInt(user.idUser) }
  }
}
