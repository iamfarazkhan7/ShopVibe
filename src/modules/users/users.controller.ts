import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { UserPayload } from 'src/types/user-payload.interface';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/role.decorator';
import { UpdateUserDto } from 'src/dtos/update-user.dto';
import { ApiResponse } from 'src/helper/api-response';

@Controller('auth')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER', 'ADMIN', 'SUPERADMIN')
  @Get('me')
  async getMe(@CurrentUser() user: UserPayload) {
    const userData = await this.usersService.getUserById(user.userId);
    return ApiResponse.success('Fetched current user successfully', userData);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/me')
  async updateUser(
    @CurrentUser() user: { userId: string; email: string },
    @Body() body: UpdateUserDto,
  ) {
    const updatedUser = await this.usersService.updateUser(user.userId, body);
    return ApiResponse.success('Profile updated successfully', updatedUser);
  }
}
