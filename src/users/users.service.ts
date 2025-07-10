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

    const tokens = await this.generateTokens(user.id, user.email);

    await this.updateUserRefreshToken(user.id, tokens.refresh_token);

    const {
      password: _password,
      refreshToken: _refreshToken,
      ...safeUser
    } = user;

    return {
        user: safeUser,
        ...tokens
    }
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const access_token = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '15m',
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
}
