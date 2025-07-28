import { UserRole } from '../../generated/prisma';
/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
  UsePipes,
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
import { PackageService } from './packages.service';
import { ApiResponseService } from '../shared/api-response.service';
import {
  CreatePackageDto,
  UpdatePackageStatusDto,
  UpdatePackageLocationDto,
  PackageQueryDto,
} from './dto/package.dto';
import { ApiResponse as ApiResponseInterface } from '../shared/interfaces/api-response.interface';

@ApiTags('Packages')
@Controller('packages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PackageController {
  constructor(
    private readonly packageService: PackageService,
    private readonly apiResponseService: ApiResponseService,
  ) {}

  @Post('create')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Create a new package',
    description: 'Create a new package with all receiver details. Admin only.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Package created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin access required',
  })
  async createPackage(
    @Body() createPackageDto: CreatePackageDto,
    @Request() req: any,
  ): Promise<ApiResponseInterface> {
    try {
      const packageData = await this.packageService.createPackage(
        createPackageDto,
        req.user.id,
      );

      return this.apiResponseService.success(
        packageData,
        'Package created successfully',
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('get-user-packages')
  @UseGuards(RolesGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Get user packages',
    description: 'Get packages based on user role and permissions',
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
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'CREATED',
      'CONFIRMED',
      'PICKED_UP',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'FAILED',
      'CANCELLED',
    ],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by tracking ID or receiver name',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Packages retrieved successfully',
  })
  async getPackages(
    @Query() query: PackageQueryDto,
    @Request() req: any,
  ): Promise<ApiResponseInterface> {
    try {
      const result = await this.packageService.getPackagesByUser(
        req.user.id,
        req.user.role,
        query,
      );

      return this.apiResponseService.paginated(
        result.packages,
        result.page,
        result.limit,
        result.total,
        'Packages retrieved successfully',
      );
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get package by ID',
    description: 'Get detailed package information with all relations',
  })
  @ApiParam({ name: 'id', description: 'Package UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Package retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Package not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied to this package',
  })
  async getPackageById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<ApiResponseInterface> {
    try {
      const packageData = await this.packageService.getPackageById(
        id,
        req.user.id,
        req.user.role,
      );

      return this.apiResponseService.success(
        packageData,
        'Package retrieved successfully',
      );
    } catch (error) {
      throw error;
    }
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COURIER)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Update package status',
    description:
      'Update package status and create status history entry. Admin and Courier only.',
  })
  @ApiParam({ name: 'id', description: 'Package UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Package status updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition or input data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin or Courier access required',
  })
  async updatePackageStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdatePackageStatusDto,
    @Request() req: any,
  ): Promise<ApiResponseInterface> {
    try {
      const updatedPackage = await this.packageService.updatePackageStatus(
        id,
        updateStatusDto,
        req.user.id,
      );

      return this.apiResponseService.success(
        updatedPackage,
        'Package status updated successfully',
      );
    } catch (error) {
      throw error;
    }
  }

  @Put(':id/location')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COURIER)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Update package location',
    description:
      'Update package current location coordinates. Admin and Courier only.',
  })
  @ApiParam({ name: 'id', description: 'Package UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Package location updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin or Courier access required',
  })
  async updatePackageLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() locationDto: UpdatePackageLocationDto,
    @Request() req: any,
  ): Promise<ApiResponseInterface> {
    try {
      await this.packageService.updatePackageLocation(
        id,
        locationDto,
        req.user.id,
      );

      return this.apiResponseService.success(
        null,
        'Package location updated successfully',
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('calculate-cost/:weight/:distance')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Calculate package cost',
    description:
      'Calculate package delivery cost based on weight and distance. Admin only.',
  })
  @ApiParam({ name: 'weight', description: 'Package weight in kg' })
  @ApiParam({ name: 'distance', description: 'Delivery distance in km' })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: ['STANDARD', 'EXPRESS', 'URGENT'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Package cost calculated successfully',
  })
  async calculatePackageCost(
    @Param('weight') weight: string,
    @Param('distance') distance: string,
    @Query('priority') priority: string = 'STANDARD',
  ): Promise<ApiResponseInterface> {
    try {
      const weightNum = parseFloat(weight);
      const distanceNum = parseFloat(distance);

      if (
        isNaN(weightNum) ||
        isNaN(distanceNum) ||
        weightNum <= 0 ||
        distanceNum < 0
      ) {
        return this.apiResponseService.error(
          'Invalid weight or distance values',
          'VALIDATION_ERROR',
        );
      }

      const cost = await this.packageService.calculatePackageCost(
        weightNum,
        distanceNum,
        priority,
      );

      return this.apiResponseService.success(
        { cost, weight: weightNum, distance: distanceNum, priority },
        'Package cost calculated successfully',
      );
    } catch (error) {
      throw error;
    }
  }
}

// Public tracking controller (no authentication required)
@ApiTags('Package Tracking')
@Controller('track')
export class PackageTrackingController {
  constructor(
    private readonly packageService: PackageService,
    private readonly apiResponseService: ApiResponseService,
  ) {}

  @Get(':trackingId')
  @ApiOperation({
    summary: 'Track package by tracking ID',
    description:
      'Public endpoint to track package status and history using tracking ID',
  })
  @ApiParam({ name: 'trackingId', description: 'Package tracking ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Package tracking information retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Package not found',
  })
  async trackPackage(
    @Param('trackingId') trackingId: string,
  ): Promise<ApiResponseInterface> {
    try {
      const packageData =
        await this.packageService.getPackageByTrackingId(trackingId);

      // Remove sensitive information for public access
      const publicPackageData = {
        id: packageData.id,
        trackingId: packageData.trackingId,
        status: packageData.status,
        weight: packageData.weight,
        description: packageData.description,
        receiverName: packageData.receiverName,
        receiverCity: packageData.receiverCity,
        receiverState: packageData.receiverState,
        receiverCountry: packageData.receiverCountry,
        preferredDeliveryDate: packageData.preferredDeliveryDate,
        actualPickupDate: packageData.actualPickupDate,
        actualDeliveryDate: packageData.actualDeliveryDate,
        createdAt: packageData.createdAt,
        updatedAt: packageData.updatedAt,
        statusHistory: packageData.statusHistory,
        locationUpdates: packageData.locationUpdates,
        deliveryAttempts: packageData.deliveryAttempts,
      };

      return this.apiResponseService.success(
        publicPackageData,
        'Package tracking information retrieved successfully',
      );
    } catch (error) {
      throw error;
    }
  }
}
