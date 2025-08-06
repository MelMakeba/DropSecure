import {
  Controller,
  Get,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma';
import { DashboardService } from './dashboard.service';
import { ApiResponseService } from '../shared/api-response.service';
import { ApiResponse as ApiResponseInterface } from '../shared/interfaces/api-response.interface';
import { AuthenticatedRequest } from 'src/auth/interfaces/authenticated-request.interface';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly apiResponseService: ApiResponseService,
  ) {}

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get admin dashboard statistics',
    description: 'Get comprehensive dashboard stats for admin users',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin access required',
  })
  async getAdminDashboardStats(): Promise<ApiResponseInterface> {
    const stats = await this.dashboardService.getDashboardStats();

    return this.apiResponseService.success(
      stats,
      'Dashboard statistics retrieved successfully',
    );
  }

  @Get('courier/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COURIER)
  @ApiOperation({
    summary: 'Get courier dashboard statistics',
    description: 'Get dashboard stats for courier users',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Courier dashboard statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Courier access required',
  })
  async getCourierDashboardStats(
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponseInterface> {
    const stats = await this.dashboardService.getCourierStats(req.user.id);

    return this.apiResponseService.success(
      stats,
      'Courier dashboard statistics retrieved successfully',
    );
  }

  @Get('sender/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SENDER)
  @ApiOperation({
    summary: 'Get sender dashboard statistics',
    description: 'Get dashboard stats for sender users',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sender dashboard statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Sender access required',
  })
  async getSenderDashboardStats(
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponseInterface> {
    const stats = await this.dashboardService.getSenderStats(req.user.id);

    return this.apiResponseService.success(
      stats,
      'Sender dashboard statistics retrieved successfully',
    );
  }
}
