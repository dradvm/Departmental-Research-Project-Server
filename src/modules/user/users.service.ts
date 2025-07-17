import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { hashPasswordHelper } from 'src/helpers/util';
import { PrismaService } from 'src/prisma/prisma.service';
import aqp from 'api-query-params';
import { isValidId } from 'src/helpers/validate-id.util';
import {
  ChangePasswordAuthDto,
  CodeAuthDto,
  CreateAuthDto
} from 'src/auth/dto/create-auth.dto';
import { v4 as uuidv4 } from 'uuid';
import * as dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '@prisma/client';

interface UpdateProfileDto {
  name: string;
  biography: string;
  img?: string;
  imgPublicId?: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService
  ) { }

  isEmailExist = async (email: string) => {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) return true;
    return false;
  };

  convertAqpFilterToPrisma(filter: any): any {
    const prismaFilter: Record<string, any> = {};
    for (const key in filter) {
      const value = filter[key];

      if (typeof value === 'object' && value !== null) {
        const sub: Record<string, any> = {};
        for (const op in value) {
          switch (op) {
            case '$gte':
              sub['gte'] = value[op];
              break;
            case '$lte':
              sub['lte'] = value[op];
              break;
            case '$gt':
              sub['gt'] = value[op];
              break;
            case '$lt':
              sub['lt'] = value[op];
              break;
            case '$ne':
              sub['not'] = value[op];
              break;
            case '$eq':
              sub['equals'] = value[op];
              break;
            default:
              break;
          }
        }
        prismaFilter[key] = sub;
      } else {
        prismaFilter[key] = value;
      }
    }
    return prismaFilter;
  }

  parseSort(sort: any) {
    if (!sort) return undefined;

    const result = [];
    for (const key in sort) {
      result.push({
        [key]: sort[key] === -1 ? 'desc' : 'asc'
      });
    }
    return result;
  }

  // async create(createUserDto: CreateUserDto) {
  //   try {
  //     const { name, email, password, gender } = createUserDto;

  //     // Check email
  //     const isExist = await this.isEmailExist(email)
  //     if (isExist) {
  //       throw new BadRequestException(`Email đã tồn tại: ${email}. Vui lòng chọn email khác`)
  //     }

  //     // Hash password
  //     const hashPassword = await hashPasswordHelper(password);
  //     const user = await this.prisma.user.create({
  //       data: {
  //         name,
  //         email,
  //         password: hashPassword,
  //         gender,
  //       },
  //     })
  //     return {
  //       id: user.userId
  //     };
  //   } catch (error) {
  //     console.error('Lỗi tạo user:', error);

  //     if (error instanceof BadRequestException) {
  //       throw error;
  //     }

  //     throw new InternalServerErrorException('Không thể tạo user');
  //   }
  // }

  async updateProfile(userId: number, data: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { userId },
      data: {
        name: data.name,
        biography: data.biography,
        ...(data.img && { img: data.img }),
        ...(data.imgPublicId && { imgPublicId: data.imgPublicId }),
      },
    })
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const { name, email, password, gender } = createUserDto;

      // Kiểm tra user theo email (bao gồm cả user đã bị isDeleted)
      const existingUser = await this.prisma.user.findUnique({
        where: { email }
      });

      // Nếu đã tồn tại và chưa bị xóa → không cho tạo lại
      if (existingUser && !existingUser.isDeleted) {
        throw new BadRequestException(
          `Email đã tồn tại: ${email}. Vui lòng chọn email khác`
        );
      }

      // Hash mật khẩu
      const hashPassword = await hashPasswordHelper(password);

      // Nếu user đã từng tồn tại và bị xóa mềm → khôi phục
      if (existingUser && existingUser.isDeleted) {
        const recoveredUser = await this.prisma.user.update({
          where: { email },
          data: {
            name,
            password: hashPassword,
            gender,
            isDeleted: false,
            updatedAt: new Date()
          }
        });

        return { id: recoveredUser.userId };
      }

      // Nếu chưa từng tồn tại → tạo mới
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashPassword,
          gender
        }
      });

      return { id: user.userId };
    } catch (error) {
      console.error('Lỗi tạo user:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Không thể tạo user');
    }
  }

  async findAll(
    limit: number,
    skip: number,
    role: string,
    searchText?: string
  ) {
    const where = {
      role: role,
      // isDeleted: false,
      ...(searchText
        ? {
          name: {
            contains: searchText.toLowerCase()
          }
        }
        : {})
    };
    const result = await this.prisma.user.findMany({
      where: where,
      take: limit,
      skip: skip
    });

    const dataLength = (await this.prisma.user.findMany({ where: where }))
      .length;

    const userWithoutPassword = result.map(
      ({ password, codeExpired, codeId, ...rest }) => rest
    );

    return {
      users: userWithoutPassword,
      length: dataLength
    };
  }

  async findOne(id: number) {
    if (!isValidId(id)) {
      throw new BadRequestException('Id không đúng định dạng');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        userId: id
      },
      select: {
        userId: true,
        name: true,
        email: true,
        gender: true,
        biography: true,
        img: true,
        imgPublicId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
        // Bỏ password, codeId, codeExpired
      }
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy user với id ${id}`);
    }

    // Nếu bạn dùng soft delete
    const deletedUser = await this.prisma.user.findFirst({
      where: {
        userId: id,
        isDeleted: true
      }
    });

    if (deletedUser) {
      throw new NotFoundException(`User với id ${id} đã bị xóa`);
    }

    return user;
  }

  async findByEmail(email: string) {
    if (!email) {
      throw new BadRequestException('Email không được để trống');
    }

    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy user với email: ${email}`);
    }

    return user;
  }

  async update(updateUserDto: UpdateUserDto) {
    const { id, name, biography, img, ...data } = updateUserDto;
    return await this.prisma.user.update({
      where: { userId: typeof id === 'bigint' ? Number(id) : id },
      data: {
        ...(name && { name }),
        ...(biography && { biography }),
        ...(img && { img })
      },
      select: {
        userId: true,
        name: true,
        biography: true,
        img: true
      }
    });
  }

  // disable user account: isDeleted: true
  async remove(id: number) {
    if (!isValidId(id)) {
      throw new BadRequestException('Id không đúng định dạng');
    }

    try {
      // Check nếu user tồn tại và chưa bị xóa
      const user = await this.prisma.user.findFirst({
        where: { userId: id, isDeleted: false }
      });

      if (!user) {
        throw new NotFoundException(
          `User với id ${id} không tồn tại hoặc đã bị xóa`
        );
      }
      // Soft delete
      return await this.prisma.user.update({
        where: { userId: id },
        data: {
          isDeleted: true
        },
        select: {
          userId: true,
          name: true,
          isDeleted: true
        }
      });
    } catch (error) {
      throw new InternalServerErrorException('Lỗi không xác định');
    }
  }

  // enable user account: isDeleted: false
  async enableUserAccount(userId: number) {
    try {
      const accountDB: User | null = await this.prisma.user.findUnique({
        where: {
          userId: userId
        }
      });
      if (!accountDB)
        throw new NotFoundException(`Can not find user with id: ${userId}`);
      if (!accountDB.isDeleted)
        throw new NotFoundException(
          `This account is enable, can not enable it!`
        );
      return await this.prisma.user.update({
        where: {
          userId: userId
        },
        data: {
          isDeleted: false
        }
      });
    } catch (e) {
      throw new InternalServerErrorException(
        `Can not enable account with id: ${userId}: ${e}`
      );
    }
  }

  async handleRegister(registerDto: CreateAuthDto) {
    try {
      const { name, email, password, gender } = registerDto;

      // Kiểm tra user theo email (bao gồm cả user đã bị isDeleted)
      const existingUser = await this.prisma.user.findUnique({
        where: { email }
      });

      // Nếu đã tồn tại và chưa bị xóa → không cho tạo lại
      if (existingUser && !existingUser.isDeleted) {
        throw new BadRequestException(
          `Email đã tồn tại: ${email}. Vui lòng chọn email khác`
        );
      }

      // Hash mật khẩu
      const hashPassword = await hashPasswordHelper(password);
      const codeId = uuidv4();
      // Nếu user đã từng tồn tại và bị xóa mềm → khôi phục
      if (existingUser && existingUser.isDeleted) {
        const recoveredUser = await this.prisma.user.update({
          where: { email },
          data: {
            name,
            password: hashPassword,
            gender,
            isActive: false,
            codeId: codeId,
            codeExpired: dayjs().add(5, 'minutes').toDate(),
            isDeleted: false,
            updatedAt: new Date()
          }
        });

        //send email
        this.mailerService.sendMail({
          to: recoveredUser.email ?? undefined, // list of receivers
          subject: 'Activate your account at @EduMarket', // Subject line
          template: 'register.hbs', //file html
          context: {
            name: recoveredUser.name,
            activationCode: codeId
          }
        });

        //trả ra phản hồi
        return { id: recoveredUser.userId };
      }

      // Nếu chưa từng tồn tại → tạo mới
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashPassword,
          gender,
          isActive: false,
          codeId: codeId,
          codeExpired: dayjs().add(5, 'minutes').toDate()
        }
      });

      //send email (bất đồng bộ)
      this.mailerService.sendMail({
        to: user.email ?? undefined, // list of receivers
        subject: 'Activate your account at @EduMarket', // Subject line
        template: 'register.hbs', //file html
        context: {
          name: user.name,
          activationCode: codeId
        }
      });

      //trả ra phản hồi
      return { id: user.userId };
    } catch (error) {
      console.error('Lỗi tạo user:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Không thể tạo user');
    }
  }

  async handleActive(data: CodeAuthDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        userId: +data.userId,
        codeId: data.code
      }
    });
    if (!user) {
      throw new BadRequestException('Mã code không hợp lệ hoặc đã hết hạn');
    }
    //check expire code
    const isBeforeCheck = dayjs().isBefore(user.codeExpired);
    if (isBeforeCheck) {
      //valid => update user
      await this.prisma.user.update({
        where: { userId: +data.userId },
        data: {
          isActive: true
        }
      });
      return { isBeforeCheck };
    } else {
      throw new BadRequestException('Mã code không hợp lệ hoặc đã hết hạn');
    }
  }

  async retryActive(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });
    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }
    if (user.isActive) {
      throw new BadRequestException('Tài khoản đã được kích hoạt');
    }
    //update user
    const codeId = uuidv4();
    await this.prisma.user.update({
      where: { email },
      data: {
        codeId: codeId,
        codeExpired: dayjs().add(5, 'minutes').toDate()
      }
    });
    //send mail
    this.mailerService.sendMail({
      to: user.email ?? undefined, // list of receivers
      subject: 'Activate your account at @EduMarket', // Subject line
      template: 'register.hbs', //file html
      context: {
        name: user.name,
        activationCode: codeId
      }
    });
    return { id: user?.userId };
  }

  async retryPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });
    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }

    //update user
    const codeId = uuidv4();
    await this.prisma.user.update({
      where: { email },
      data: {
        codeId: codeId,
        codeExpired: dayjs().add(5, 'minutes').toDate()
      }
    });
    //send mail
    this.mailerService.sendMail({
      to: user.email ?? undefined, // list of receivers
      subject: 'Change your password account at @EduMarket', // Subject line
      template: 'register.hbs', //file html
      context: {
        name: user.name,
        activationCode: codeId
      }
    });
    return { id: user?.userId, email: user?.email };
  }

  async changePassword(data: ChangePasswordAuthDto) {
    if (data.confirmPassword !== data.password) {
      throw new BadRequestException(
        'Mật khẩu và xác nhận mật khẩu không chính xác'
      );
    }

    let user = await this.prisma.user.findUnique({
      where: { email: data.email }
    });
    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }

    user = await this.prisma.user.findFirst({
      where: {
        codeId: data.code,
      },
    });
    if (!user) {
      throw new BadRequestException("Mã code không hợp lệ hoặc đã hết hạn")
    }

    //check expire code
    const isBeforeCheck = dayjs().isBefore(user.codeExpired);
    if (isBeforeCheck) {
      //valid => update password
      const newPassword = await hashPasswordHelper(data.password);
      await this.prisma.user.update({
        where: { email: data.email },
        data: {
          password: newPassword
        }
      });
      return { isBeforeCheck };
    } else {
      throw new BadRequestException('Mã code không hợp lệ hoặc đã hết hạn');
    }
  }

  async updateUserRole(userId: number, role: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { userId: userId },
      data: { role },
    });
  }
}
