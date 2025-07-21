import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from 'src/dtos/create-category.dto';
import { UpdateCategoryDto } from 'src/dtos/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    try {
      if (dto.parentId) {
        const parentExists = await this.prisma.category.findUnique({
          where: { id: dto.parentId },
        });

        if (!parentExists) {
          throw new BadRequestException('Parent category not found');
        }
      }

      const category = await this.prisma.category.create({ data: dto });
      return category;
    } catch (error) {
      console.error('Create category error:', error);
      throw new InternalServerErrorException('Failed to create category');
    }
  }

  async findAll() {
    try {
      return await this.prisma.category.findMany({
        include: {
          children: true,
          parent: true,
        },
      });
    } catch (error) {
      console.error('Fetch categories error:', error);
      throw new InternalServerErrorException('Failed to fetch categories');
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    try {
      const existing = await this.prisma.category.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Category not found');
      }

      return await this.prisma.category.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      console.error('Update category error:', error);
      throw new InternalServerErrorException('Failed to update category');
    }
  }

  async remove(id: string) {
    try {
      const existing = await this.prisma.category.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Category not found');
      }

      await this.prisma.category.delete({ where: { id } });
      return { message: 'Category deleted successfully' };
    } catch (error) {
      console.error('Delete category error:', error);
      throw new InternalServerErrorException('Failed to delete category');
    }
  }
}
