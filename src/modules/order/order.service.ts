import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from 'src/dtos/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async checkout(userId: string, dto: CreateOrderDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        let total = 0;
        const orderItems = [];

        for (const item of dto.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new NotFoundException(`Product not found: ${item.productId}`);
          }
          if (product.stock < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for product: ${item.productId}`,
            );
          }

          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });

          total += product.price * item.quantity;

          orderItems.push({
            productId: product.id,
            quantity: item.quantity,
            price: product.price,
          });
        }

        const order = await tx.order.create({
          data: {
            userId,
            total,
            status: 'PENDING',
            items: { create: orderItems },
          },
          include: { items: true },
        });
        return order;
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException('Checkout failed');
    }
  }

  async getOrders(userId: string) {
    try {
      return await this.prisma.order.findMany({
        where: { userId },
        include: { items: true },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch orders');
    }
  }
}
