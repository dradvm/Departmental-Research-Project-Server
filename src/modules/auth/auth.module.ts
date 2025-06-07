import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { LocalStrategy } from './local.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
    imports: [PassportModule],
    controllers: [AuthController],
    providers: [AuthService, PrismaService, LocalStrategy],
})
export class AuthModule { }
