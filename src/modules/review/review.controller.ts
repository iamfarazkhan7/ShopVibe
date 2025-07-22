import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { UserPayload } from 'src/types/user-payload.interface';
import { CreateReviewDto } from 'src/dtos/create-review.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ApiResponse } from 'src/helper/api-response';

@Controller('review')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':productId')
  async create(
    @Param('productId') productId: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateReviewDto,
  ) {
    const review = await this.reviewService.create(productId, user.userId, dto);
    return ApiResponse.success('Review created successfully', review);
  }

  @Get(':productId')
  async getAll(@Param('productId') productId: string) {
    const reviews = await this.reviewService.getReviews(productId);
    return ApiResponse.success('Reviews fetched successfully', reviews);
  }
}
