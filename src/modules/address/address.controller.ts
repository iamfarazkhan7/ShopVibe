import {
  Controller,
  Post,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { AddressService } from './address.service';
import { UserPayload } from 'src/types/user-payload.interface';
import { CreateAddressDto } from 'src/dtos/create-address.dto';
import { UpdateAddressDto } from 'src/dtos/update-address.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ApiResponse } from 'src/helper/api-response';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateAddressDto,
  ) {
    const address = await this.addressService.create(user.userId, dto);
    return ApiResponse.success('Address created successfully', address);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@CurrentUser() user: UserPayload) {
    const addresses = await this.addressService.findAll(user.userId);
    return ApiResponse.success('Addresses fetched successfully', addresses);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateAddressDto,
  ) {
    const updated = await this.addressService.update(id, dto, user.userId);
    return ApiResponse.success('Address updated successfully', updated);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const removed = await this.addressService.remove(id, user.userId);
    return ApiResponse.success('Address removed successfully', removed);
  }
}
