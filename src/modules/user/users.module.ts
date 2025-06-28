import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Reflector } from '@nestjs/core';
import { TransformInterceptor } from 'src/auth/core/transform.interceptor';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule,],
  controllers: [UsersController],
  providers: [UsersService, PrismaService, Reflector,
    TransformInterceptor],
  exports: [UsersService]
})
export class UsersModule { }