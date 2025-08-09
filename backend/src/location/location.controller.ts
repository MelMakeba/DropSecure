/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
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
} from '@nestjs/swagger';
import { LocationService } from './location.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, PackageStatus } from '../../generated/prisma';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ApiResponseService } from '../shared/api-response.service';
import { ApiResponse as ApiResponseInterface } from '../shared/interfaces/api-response.interface';

// Create DTOs for type safety
export class UpdateLocationDto {
  packageId: string;
  latitude: number;
  longitude: number;
  address?: string;
  notes?: string;
}

export class UpdatePackageStatusDto {
  status: PackageStatus;
  notes?: string;
}

@ApiTags('Location')
@Controller('location')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LocationController {
  constructor(
    private readonly locationService: LocationService,
    private readonly apiResponseService: ApiResponseService,
  ) {}

  @Post('update')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COURIER)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Update courier location',
    description: 'Update courier location for package tracking',
  })
  @ApiResponse({
    status: 201,
    description: 'Location updated successfully',
  })
  async updateLocation(
    @Body() body: UpdateLocationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponseInterface> {
    const locationUpdate = await this.locationService.updateCourierLocation({
      courierId: req.user.id,
      ...body,
    });

    return this.apiResponseService.success(
      locationUpdate,
      'Location updated successfully',
    );
  }

  @Patch('package/:packageId/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COURIER)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Update package status',
    description: 'Update package delivery status',
  })
  @ApiParam({ name: 'packageId', description: 'Package UUID' })
  async updatePackageStatus(
    @Param('packageId', ParseUUIDPipe) packageId: string,
    @Body() body: UpdatePackageStatusDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponseInterface> {
    const updatedPackage = await this.locationService.updatePackageStatus(
      packageId,
      req.user.id,
      body.status,
      body.notes,
    );

    return this.apiResponseService.success(
      updatedPackage,
      'Package status updated successfully',
    );
  }

  @Get('package/:packageId/history')
  @ApiOperation({
    summary: 'Get package location history',
    description: 'Get complete location tracking history for a package',
  })
  @ApiParam({ name: 'packageId', description: 'Package UUID' })
  async getLocationHistory(
    @Param('packageId', ParseUUIDPipe) packageId: string,
  ): Promise<ApiResponseInterface> {
    const history =
      await this.locationService.getPackageLocationHistory(packageId);

    return this.apiResponseService.success(
      history,
      'Location history retrieved successfully',
    );
  }

  @Get('package/:packageId/current')
  @ApiOperation({
    summary: 'Get current package location',
    description: 'Get current location of a package',
  })
  @ApiParam({ name: 'packageId', description: 'Package UUID' })
  async getCurrentPackageLocation(
    @Param('packageId', ParseUUIDPipe) packageId: string,
  ): Promise<ApiResponseInterface> {
    const currentLocation =
      await this.locationService.getActivePackageLocation(packageId);

    return this.apiResponseService.success(
      currentLocation,
      'Current package location retrieved successfully',
    );
  }

  @Get('courier/current')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COURIER)
  @ApiOperation({
    summary: 'Get current courier location',
    description: 'Get current location of the authenticated courier',
  })
  async getCurrentCourierLocation(
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponseInterface> {
    const currentLocation = await this.locationService.getCurrentLocation(
      req.user.id,
    );

    return this.apiResponseService.success(
      currentLocation,
      'Current courier location retrieved successfully',
    );
  }
}
