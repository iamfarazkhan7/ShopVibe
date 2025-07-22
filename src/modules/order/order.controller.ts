import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { UserPayload } from 'src/types/user-payload.interface';
import { CreateOrderDto } from 'src/dtos/create-order.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ApiResponse } from 'src/helper/api-response';

@Controller('order')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/checkout')
  async checkout(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateOrderDto,
  ) {
    const order = await this.orderService.checkout(user.userId, dto);
    return ApiResponse.success('Order placed successfully', order);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserOrders(@CurrentUser() user: UserPayload) {
    const orders = await this.orderService.getOrders(user.userId);
    return ApiResponse.success('Orders fetched successfully', orders);
  }
}
