import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview() {
    return {
      deliveryStats: await this.dashboardService.getDeliveryStats(),
      revenue: await this.dashboardService.getRevenueMetrics(),
      userStats: await this.dashboardService.getUserStats(),
    };
  }

  @Get('packages')
  async getPackageMetrics(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.dashboardService.getPackageMetrics({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('couriers')
  async getCourierPerformance() {
    return this.dashboardService.getCourierPerformance();
  }

  @Get('revenue')
  async getRevenueMetrics() {
    return this.dashboardService.getRevenueMetrics();
  }

  @Get('reports')
  async getReports(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.dashboardService.getReports({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
    });
  }
}
