import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponseService } from 'src/shared/api-response.service';

@Module({
  providers: [DashboardService, PrismaService, ApiResponseService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}
