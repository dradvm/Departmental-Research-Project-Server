import { Injectable } from '@nestjs/common';
import { AuthRequest } from './auth.request.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserWithoutPassword } from '../user/user.interface';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}
  authenticate(request: AuthRequest): string {
    console.log(request);
    return 'Attempt from auth service';
  }

  async validateUser(
    email: string,
    password: string
  ): Promise<UserWithoutPassword | null> {
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
    return result;
  }
}
