import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewsController } from './review.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponseService } from 'src/shared/api-response.service';

@Module({
  providers: [ReviewService, PrismaService, ApiResponseService],
  controllers: [ReviewsController],
})
export class ReviewModule {}
