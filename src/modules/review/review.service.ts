import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateReviewDto } from 'src/dtos/create-review.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async create(productId: string, userId: string, dto: CreateReviewDto) {
    try {
      const existing = await this.prisma.review.findUnique({
        where: { userId_productId: { userId, productId } },
      });

      if (existing) {
        throw new ForbiddenException('You have already reviewed this product');
      }

      return await this.prisma.review.create({
        data: {
          rating: dto.rating,
          comment: dto.comment,
          userId,
          productId,
        },
      });
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException('Failed to create review');
    }
  }

  async getReviews(productId: string) {
    try {
      return await this.prisma.review.findMany({
        where: { productId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch reviews');
    }
  }
}
