import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import {
  ReviewRequestBody,
  UpdateReviewRequestBody,
  AuthenticatedRequest,
} from './interfaces/review-request.interface';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // POST /reviews/package/:packageId
  @Post('package/:packageId')
  @UseGuards(JwtAuthGuard)
  async createReview(
    @Param('packageId') packageId: string,
    @Body() body: ReviewRequestBody,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    return this.reviewService.createPackageReview(
      userId,
      packageId,
      body.rating,
      body.comment,
    );
  }

  // GET /reviews/package/:packageId
  @Get('package/:packageId')
  async getPackageReviews(@Param('packageId') packageId: string) {
    return this.reviewService.getPackageReviews(packageId);
  }

  // GET /reviews/courier/:courierId
  @Get('courier/:courierId')
  async getCourierReviews(@Param('courierId') courierId: string) {
    return this.reviewService.getCourierReviews(courierId);
  }

  // PUT /reviews/:reviewId
  @Put(':reviewId')
  // @UseGuards(JwtAuthGuard)
  async updateReview(
    @Param('reviewId') reviewId: string,
    @Body() body: UpdateReviewRequestBody,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id; // Uncomment if using auth
    return this.reviewService.updateReview(
      reviewId,
      userId,
      body.rating,
      body.comment,
    );
  }
}
