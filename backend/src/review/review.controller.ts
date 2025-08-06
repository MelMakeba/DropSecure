import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma';
import { ReviewService } from './review.service';
import { ApiResponseService } from '../shared/api-response.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ApiResponse as ApiResponseInterface } from '../shared/interfaces/api-response.interface';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewService,
    private readonly apiResponseService: ApiResponseService,
  ) {}

  @Post(':packageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SENDER)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Create a review for a delivered package',
    description: 'Sender can review a package after it has been delivered',
  })
  @ApiParam({ name: 'packageId', description: 'Package UUID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Review submitted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or package not eligible for review',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Sender access required',
  })
  async createReview(
    @Param('packageId', ParseUUIDPipe) packageId: string,
    @Body() createReviewDto: CreateReviewDto,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponseInterface> {
    const review = await this.reviewsService.createPackageReview(
      packageId,
      req.user.id,
      createReviewDto,
    );

    return this.apiResponseService.success(
      review,
      'Review submitted successfully',
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get public reviews',
    description: 'Get all public reviews for display on website',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reviews retrieved successfully',
  })
  async getReviews(): Promise<ApiResponseInterface> {
    const reviews = await this.reviewsService.getPackageReviews('');

    return this.apiResponseService.success(
      reviews,
      'Reviews retrieved successfully',
    );
  }

  @Get('package/:packageId')
  @ApiOperation({
    summary: 'Get reviews for a specific package',
    description: 'Get all public reviews for a specific package',
  })
  @ApiParam({ name: 'packageId', description: 'Package UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Package reviews retrieved successfully',
  })
  async getPackageReviews(
    @Param('packageId', ParseUUIDPipe) packageId: string,
  ): Promise<ApiResponseInterface> {
    const reviews = await this.reviewsService.getPackageReviews(packageId);

    return this.apiResponseService.success(
      reviews,
      'Package reviews retrieved successfully',
    );
  }
}
