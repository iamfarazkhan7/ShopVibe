import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from 'src/dtos/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserById(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatarUrl: true,
          phone: true,
          lastLogin: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async updateUser(userId: string, user: UpdateUserDto) {
    try {
      if (user.email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser && existingUser.id !== userId) {
          throw new BadRequestException('Email is already in use');
        }
      }

      const updateUser = await this.prisma.user.update({
        where: { id: userId },

        data: {
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          phone: user.phone,
        },
      });

      const { password, refreshToken, ...safeUser } = updateUser;

      return safeUser;
    } catch (error) {
      console.error('Update User Error:', error);
      throw new InternalServerErrorException('Profile update failed');
    }
  }
}
