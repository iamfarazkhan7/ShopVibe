import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/dtos/create-user.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginUserDto } from 'src/dtos/login-user.dto';
import { use } from 'passport';
import { ResetPasswordDto } from 'src/dtos/reset-passsword.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async createUser({
    email,
    password,
    name,
    emailVerified = false,
    refreshToken,
    role = 'USER',
  }: CreateUserDto) {
    try {
      const emailAlreadyExists = await this.prisma.user.findUnique({
        where: { email },
      });

      if (emailAlreadyExists) {
        throw new BadRequestException('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          ...(name && { name }),
          ...(emailVerified && { emailVerified }),
          ...(refreshToken && { refreshToken }),
          ...(role && { role }),
        },
      });

      const { password: _, ...safeUser } = user;

      console.log('User created:', user);
      return safeUser;
    } catch (error) {
      console.error('Error creating user:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'Email already exists (unique constraint)',
          );
        }
      }

      throw new InternalServerErrorException('User creation failed');
    }
  }

  async LoginUser({ email, password }: LoginUserDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid email');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);

      await this.updateUserRefreshToken(user.id, tokens.refresh_token);

      const {
        password: _password,
        refreshToken: _refreshToken,
        ...safeUser
      } = user;

      console.log(safeUser, 'safeuser');
      return {
        user: safeUser,
        ...tokens,
      };
    } catch (error) {
      console.log('Error Logging in user', error);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException('Login failed');
    }
  }

  async getUserById(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
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

  async Logout(userId: string) {
    console.log('Logout Service: userId =', userId);
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });

      return { message: 'Logout successful' };
    } catch (error) {
      console.error('Logout error:', error);
      throw new InternalServerErrorException('Logout failed');
    }
  }

  async refreshTokens(refresh_token: string) {
    try {
      const userId = this.extractUserIdFromToken(refresh_token);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Acess Denied');
      }

      const isMatch = await bcrypt.compare(refresh_token, user.refreshToken);

      if (!isMatch) {
        throw new UnauthorizedException('Invalid Refresh Token');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.updateUserRefreshToken(user.id, tokens.refresh_token);

      return tokens;
    } catch (error) {
      console.error('Refresh error:', error);
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  async resetPassword({
    email,
    currentPassword,
    newPassword,
  }: ResetPasswordDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const isOldPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );

      if (!isOldPasswordValid) {
        throw new UnauthorizedException('Invalid current password');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          refreshToken: null,
        },
      });

      return { message: 'Password reset successfully' };
    } catch (error) {
      console.error(`Error resetting password for user ${email}:`, error);
      throw new InternalServerErrorException('Error resetting password');
    }
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const access_token = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '2m',
    });

    const refresh_token = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '7d',
    });

    return { access_token, refresh_token };
  }

  private async updateUserRefreshToken(userId: string, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, 10);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedToken },
    });
  }

  private extractUserIdFromToken(token: string): string {
    try {
      const payload = this.jwt.verify(token, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
      });

      return payload.sub;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
