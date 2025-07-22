import {
  Body,
  Controller,
  Get,
  Param,
  Query,
  Post,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from 'src/dtos/create-product.dto';
import { UpdateProductDto } from 'src/dtos/update-product.dto';
import { FindProductDto } from 'src/dtos/product-filter.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ApiResponse } from 'src/helper/api-response';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(@Query() query: any) {
    const { minPrice, maxPrice, rating, ...rest } = query;
    const parsedQuery = {
      ...rest,
      minPrice:
        minPrice && !isNaN(Number(minPrice)) ? Number(minPrice) : undefined,
      maxPrice:
        maxPrice && !isNaN(Number(maxPrice)) ? Number(maxPrice) : undefined,
      rating: rating && !isNaN(Number(rating)) ? Number(rating) : undefined,
    };
    const products = await this.productService.findAll(parsedQuery);
    return ApiResponse.success('Products fetched successfully', products);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const product = await this.productService.findOne(id);
    return ApiResponse.success('Product fetched successfully', product);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateProductDto) {
    const product = await this.productService.create(dto);
    return ApiResponse.success('Product created successfully', product);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const product = await this.productService.update(id, dto);
    return ApiResponse.success('Product updated successfully', product);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.productService.remove(id);
    return ApiResponse.success('Product deleted successfully');
  }
}
