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

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  findAll(@Query() query: any) {
    const { minPrice, maxPrice, rating, ...rest } = query;

    const parsedQuery = {
      ...rest,
      minPrice:
        minPrice && !isNaN(Number(minPrice)) ? Number(minPrice) : undefined,
      maxPrice:
        maxPrice && !isNaN(Number(maxPrice)) ? Number(maxPrice) : undefined,
      rating: rating && !isNaN(Number(rating)) ? Number(rating) : undefined,
    };

    return this.productService.findAll(parsedQuery);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
