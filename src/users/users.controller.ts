import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from 'src/dtos/create-user.dto';
import { LoginUserDto } from 'src/dtos/login-user.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { UserPayload } from 'src/types/user-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenDto } from 'src/dtos/refresh-token.dto';
import { ResetPasswordDto } from 'src/dtos/reset-passsword.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/role.decorator';

@Controller('auth')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  @Post('/signup')
  createUser(@Body() body: CreateUserDto) {
    return this.usersService.createUser(body);
  }

  @Post('/signin')
  LoginUser(@Body() body: LoginUserDto) {
    return this.usersService.LoginUser(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER', 'ADMIN', 'SUPERADMIN')
  @Get('me')
  GetMe(@CurrentUser() user: UserPayload) {
    return this.usersService.getUserById(user.userId);
  }

  @Post('refresh')
  refresh(@Body() body: RefreshTokenDto) {
    return this.usersService.refreshTokens(body.refresh_token);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('logout')
  logout(@CurrentUser() user: { userId: string; email: string }) {
    return this.usersService.Logout(user.userId);
  }

  @Patch('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.usersService.resetPassword(body);
  }
}
