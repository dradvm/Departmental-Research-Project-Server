import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  Req,
  UseGuards,
  Put
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/decorator/customize';
import { TransformInterceptor } from 'src/auth/core/transform.interceptor';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/decorator/role.decorator';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';

@UseInterceptors(TransformInterceptor)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinary: CloudinaryService
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('update-profile')
  @UseInterceptors(FileInterceptor('file'))
  async updateProfile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Body() body: { name: string; biography: string }
  ) {
    const img = file
      ? (await this.cloudinary.uploadImage(file, 'avatars')).secure_url
      : undefined;

    await this.usersService.updateProfile(req.user.userId, {
      name: body.name,
      biography: body.biography,
      img
    });

    return {
      message: 'Profile updated successfully',
      image: img
    };
  }

  @Get()
  async findAll(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('role') role: string,
    @Query('searchText') searchText?: string
  ) {
    return this.usersService.findAll(
      parseInt(limit),
      parseInt(skip),
      role,
      searchText || undefined
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const userId = parseInt(id, 10);
    return this.usersService.findOne(userId);
  }

  @Patch()
  update(@Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(updateUserDto);
  }

  // disable user account
  @Delete(':id')
  remove(@Param('id') id: string) {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new BadRequestException('Id không hợp lệ');
    }
    return this.usersService.remove(userId);
  }
  // enable user account
  @Put('/:id')
  async enableUserAccout(@Param('id') id: string) {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new BadRequestException('id is not valid');
    }
    return await this.usersService.enableUserAccount(userId);
  }
}
