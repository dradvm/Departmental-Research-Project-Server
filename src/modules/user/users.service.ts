import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { hashPasswordHelper } from 'src/helpers/util';
import { PrismaService } from 'src/prisma/prisma.service';
import aqp from 'api-query-params';
import { isValidId } from 'src/helpers/validate-id.util';
import { error } from 'console';


@Injectable()
export class UsersService {

  constructor(private readonly prisma: PrismaService) { }



  isEmailExist = async (email: string) => {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) return true;
    return false;
  }

  convertAqpFilterToPrisma(filter: any): any {
    const prismaFilter: Record<string, any> = {};
    for (const key in filter) {
      const value = filter[key];

      if (typeof value === 'object' && value !== null) {
        const sub: Record<string, any> = {};
        for (const op in value) {
          switch (op) {
            case '$gte': sub['gte'] = value[op]; break;
            case '$lte': sub['lte'] = value[op]; break;
            case '$gt': sub['gt'] = value[op]; break;
            case '$lt': sub['lt'] = value[op]; break;
            case '$ne': sub['not'] = value[op]; break;
            case '$eq': sub['equals'] = value[op]; break;
            default: break;
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

  async create(createUserDto: CreateUserDto) {
    try {
      const { name, email, password, gender } = createUserDto;

      // Check email
      const isExist = await this.isEmailExist(email)
      if (isExist) {
        throw new BadRequestException(`Email đã tồn tại: ${email}. Vui lòng chọn email khác`)
      }

      // Hash password
      const hashPassword = await hashPasswordHelper(password);
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashPassword,
          gender,
        },
      })
      return {
        id: user.userId
      };
    } catch (error) {
      console.error('Lỗi tạo user:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Không thể tạo user');
    }
  }

  async findAll(query: string, current: number, pageSize: number) {
    const { filter, sort } = aqp(query);
    if (filter.current) delete filter.current;
    if (filter.pageSize) delete filter.pageSize;
    const prismaFilter = this.convertAqpFilterToPrisma(filter)
    if (!current) current = 1;
    if (!pageSize) pageSize = 10;

    const totalItems = (await this.prisma.user.findMany(prismaFilter)).length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const skip = (current - 1) * (pageSize);

    const result = await this.prisma.user.findMany({
      where: prismaFilter,
      take: pageSize,
      skip: skip,
      orderBy: sort ? this.parseSort(sort) : undefined,
    });

    const userWithoutPassword = result.map(({ password, codeExpired, codeId, ...rest }) => rest);

    return { userWithoutPassword, totalPages };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async update(updateUserDto: UpdateUserDto) {
    const { id, name, biography, img, ...data } = updateUserDto;
    return await this.prisma.user.update({
      where: { userId: typeof id === 'bigint' ? Number(id) : id },
      data: {
        ...(name && { name }),
        ...(biography && { biography }),
        ...(img && { img }),
      },
      select: {
        userId: true,
        name: true,
        biography: true,
        img: true,
      },
    });
  }

  async remove(id: number) {
    if (!isValidId(id)) {
      throw new BadRequestException('Id không đúng định dạng');
    }

    try {
      return await this.prisma.user.delete({
        where: { userId: id },
      });
    } catch (error) {
      if (
        error.code === 'P2025' ||
        error.message.includes('Record to delete does not exist')
      ) {
        throw new NotFoundException(`User với id ${id} không tồn tại`);
      }
      console.log(error)
      throw new InternalServerErrorException('Lỗi không xác định');
    }
  }

}
