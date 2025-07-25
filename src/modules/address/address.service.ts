import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateAddressDto } from 'src/dtos/create-address.dto';
import { UpdateAddressDto } from 'src/dtos/update-address.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateAddressDto) {
    try {
      if (dto.isDefault) {
        await this.prisma.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }
      return await this.prisma.address.create({
        data: {
          ...dto,
          userId,
        },
      });
    } catch (error) {
      console.error('Create Address Error:', error);
      throw new InternalServerErrorException('Failed to create address');
    }
  }

  async findAll(userId: string) {
    try {
      return await this.prisma.address.findMany({
        where: { userId },
        orderBy: { isDefault: 'desc' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch addresses');
    }
  }

  async update(id: string, dto: UpdateAddressDto, userId: string) {
    try {
      const address = await this.prisma.address.findFirst({
        where: { id, userId },
      });

      if (!address) {
        throw new NotFoundException('Address not found or access denied');
      }

      return await this.prisma.address.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to update address');
    }
  }

  async remove(id: string, userId: string) {
    try {
      return await this.prisma.address.deleteMany({
        where: { id, userId },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to remove address');
    }
  }
}
