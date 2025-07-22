import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { UserPayload } from 'src/types/user-payload.interface';
import { AddToCartDto, UpdateCartItemDto } from 'src/dtos/cart-item.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ApiResponse } from 'src/helper/api-response';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getCart(@CurrentUser() user: UserPayload) {
    const cart = await this.cartService.getCart(user.userId);
    return ApiResponse.success('Cart fetched successfully', cart);
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addToCart(@CurrentUser() user: UserPayload, @Body() dto: AddToCartDto) {
    const item = await this.cartService.addToCart(user.userId, dto);
    return ApiResponse.success('Item added to cart successfully', item);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update')
  async updateCartItem(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateCartItemDto,
  ) {
    const item = await this.cartService.updateCartItem(user.userId, dto);
    return ApiResponse.success('Cart item updated successfully', item);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('remove')
  async removeFromCart(
    @CurrentUser() user: UserPayload,
    @Query('productId') productId: string,
  ) {
    const result = await this.cartService.removeFromCart(
      user.userId,
      productId,
    );
    return ApiResponse.success('Item removed from cart successfully', result);
  }
}
