import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from 'src/dtos/create-product.dto';
import { UpdateProductDto } from 'src/dtos/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    try {
      return await this.prisma.product.create({ data: dto });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create product');
    }
  }

  async findAll(query: {
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    search?: string;
  }) {
    try {
      const { categoryId, minPrice, maxPrice, rating, search } = query;
      return await this.prisma.product.findMany({
        where: {
          AND: [
            categoryId ? { categoryId } : {},
            minPrice ? { price: { gte: minPrice } } : {},
            maxPrice ? { price: { lte: maxPrice } } : {},
            rating ? { rating: { gte: rating } } : {},
            search
              ? {
                  OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                  ],
                }
              : {},
          ],
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch products');
    }
  }

  async findOne(id: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      return product;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch product');
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: dto,
      });
      return product;
    } catch (error) {
      throw new InternalServerErrorException('Failed to update product');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.product.delete({ where: { id } });
      return { message: 'Product deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete product');
    }
  }
}
