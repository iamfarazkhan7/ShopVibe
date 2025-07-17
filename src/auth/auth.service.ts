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
import { ResetPasswordDto } from 'src/dtos/reset-passsword.dto';
import { signToken } from 'src/helper/token.util';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: CreateUserDto) {
    try {
      const userExists = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (userExists) {
        throw new BadRequestException('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
          emailVerified: dto.emailVerified ?? false,
          role: dto.role ?? 'USER',
          avatarUrl: dto.avatarUrl,
          phone: dto.phone,
          provider: dto.provider,
        },
      });

      const { password, refreshToken, ...safeUser } = user;
      return safeUser;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Email already exists');
      }
      throw new InternalServerErrorException('Signup failed');
    }
  }

  async signin(dto: LoginUserDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isMatch = await bcrypt.compare(dto.password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      await this.updateUserRefreshToken(user.id, tokens.refresh_token);

      const { password, refreshToken, ...safeUser } = user;

      return {
        user: safeUser,
        ...tokens,
      };
    } catch (error) {
      throw new InternalServerErrorException('Signin failed');
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

  async logout(userId: string) {
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

  async resetPassword(dto: ResetPasswordDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const isOldPasswordValid = await bcrypt.compare(
        dto.currentPassword,
        user.password,
      );

      if (!isOldPasswordValid) {
        throw new UnauthorizedException('Invalid current password');
      }

      const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

      await this.prisma.user.update({
        where: { email: dto.email },
        data: {
          password: hashedPassword,
          refreshToken: null,
        },
      });

      return { message: 'Password reset successfully' };
    } catch (error) {
      console.error(`Error resetting password for user ${dto.email}:`, error);
      throw new InternalServerErrorException('Error resetting password');
    }
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.config.get<string>('JWT_ACCESS_SECRET');

    const [access_token, refresh_token] = await Promise.all([
      signToken(this.jwt, payload, accessSecret, '12h'),
      signToken(this.jwt, payload, refreshSecret, '7d'),
    ]);

    return { access_token, refresh_token };
  }

  private async updateUserRefreshToken(userId: string, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
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
