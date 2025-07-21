import { Controller, Post, Body, Patch, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/dtos/create-user.dto';
import { LoginUserDto } from 'src/dtos/login-user.dto';
import { RefreshTokenDto } from 'src/dtos/refresh-token.dto';
import { ResetPasswordDto } from 'src/dtos/reset-passsword.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ApiResponse } from 'src/helper/api-response';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  async signup(@Body() dto: CreateUserDto) {
    const user = await this.authService.signup(dto);
    return ApiResponse.success('User signed up successfully', user);
  }

  @Post('/signin')
  async signin(@Body() dto: LoginUserDto) {
    const result = await this.authService.signin(dto);
    return ApiResponse.success('User signed in successfully', result);
  }

  @Post('/refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    const tokens = await this.authService.refreshTokens(dto.refresh_token);
    return ApiResponse.success('Token refreshed successfully', tokens);
  }

  @Patch('/logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: { userId: string }) {
    await this.authService.logout(user.userId);
    return ApiResponse.success('Logout successful');
  }

  @Patch('/reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return ApiResponse.success('Password reset successfully');
  }
}
