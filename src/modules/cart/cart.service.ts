import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { AddToCartDto, UpdateCartItemDto } from 'src/dtos/cart-item.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });
      if (!cart) {
        return await this.prisma.cart.create({
          data: { userId },
          include: {
            items: { include: { product: true } },
          },
        });
      }
      return cart;
    } catch (error) {
      throw new InternalServerErrorException('Failed to get cart');
    }
  }

  async addToCart(userId: string, dto: AddToCartDto) {
    try {
      let cart = await this.prisma.cart.findUnique({ where: { userId } });
      if (!cart) {
        cart = await this.prisma.cart.create({ data: { userId } });
      }
      const existingItem = await this.prisma.cartItem.findFirst({
        where: { cartId: cart.id, productId: dto.productId },
      });
      if (existingItem) {
        return await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + dto.quantity },
        });
      }
      return await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to add to cart');
    }
  }

  async updateCartItem(userId: string, dto: UpdateCartItemDto) {
    try {
      const cart = await this.prisma.cart.findUnique({ where: { userId } });
      if (!cart) throw new NotFoundException('Cart not found');
      const item = await this.prisma.cartItem.findFirst({
        where: { cartId: cart.id, productId: dto.productId },
      });
      if (!item) throw new NotFoundException('Item not found');
      return await this.prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity: dto.quantity },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to update cart item');
    }
  }

  async removeFromCart(userId: string, productId: string) {
    try {
      const cart = await this.prisma.cart.findUnique({ where: { userId } });
      if (!cart) throw new NotFoundException('Cart not found');
      const item = await this.prisma.cartItem.findFirst({
        where: { cartId: cart.id, productId },
      });
      if (!item) throw new NotFoundException('Item not found');
      await this.prisma.cartItem.delete({ where: { id: item.id } });
      return { message: 'Item removed from cart' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to remove item from cart');
    }
  }
}
