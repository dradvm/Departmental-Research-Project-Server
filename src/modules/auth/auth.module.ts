import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRETKEY,
      signOptions: { expiresIn: '5m' }
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService]
})
export class AuthModule {}
