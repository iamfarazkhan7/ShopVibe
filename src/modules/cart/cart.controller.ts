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

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getCart(@CurrentUser() user: UserPayload) {
    return this.cartService.getCart(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  addToCart(@CurrentUser() user: UserPayload, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update')
  updateCartItem(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('remove')
  removeFromCart(
    @CurrentUser() user: UserPayload,
    @Query('productId') productId: string,
  ) {
    return this.cartService.removeFromCart(user.userId, productId);
  }
}
