/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CourierService } from './courier.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'generated/prisma';
import {
  UpdateCourierStatusRequest,
  UpdateLocationRequest,
  CourierProfileData,
  CourierProfileWithStats,
} from './interfaces/courier.interfaces';
import { ApiResponseService } from '../shared/api-response.service';
import { ApiResponse } from '../shared/interfaces/api-response.interface';
import { PackageService } from 'src/packages/packages.service';

// Define a type for the request user if you have one, otherwise define minimally here:
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    sub: string;
    courierProfileId?: string; // add other user properties as needed
  };
}

@Controller('courier')
@UseGuards(JwtAuthGuard)
export class CourierController {
  constructor(
    private readonly courierService: CourierService,
    private readonly apiResponseService: ApiResponseService,
    private readonly packagesService: PackageService,
  ) {}

  @Get('profile')
  @Roles(UserRole.COURIER)
  @UseGuards(RolesGuard)
  async getCourierProfile(
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<CourierProfileWithStats>> {
    const userId = req.user.id || req.user.sub; // <-- use sub, not id
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    const profile = await this.courierService.getCourierProfile(userId);
    return this.apiResponseService.success(
      profile,
      'Courier profile retrieved successfully',
    );
  }

  @Get('admin/couriers')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getAllCouriers(): Promise<ApiResponse<CourierProfileData[]>> {
    const couriers = await this.courierService.getAllCouriers();
    return this.apiResponseService.success(
      couriers,
      'All couriers retrieved successfully',
    );
  }

  @Get('admin/couriers/available')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getAvailableCouriers(): Promise<ApiResponse<CourierProfileData[]>> {
    const couriers = await this.courierService.getAvailableCouriers();
    return this.apiResponseService.success(
      couriers,
      'Available couriers retrieved successfully',
    );
  }

  @Put('admin/courier/:id/verify')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async verifyCourier(
    @Param('id') courierId: string,
  ): Promise<ApiResponse<CourierProfileData>> {
    const courier = await this.courierService.verifyCourier(courierId);
    return this.apiResponseService.success(
      courier,
      'Courier verified successfully',
    );
  }

  @Put('admin/courier/:id/status')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async updateCourierStatus(
    @Param('id') courierId: string,
    packageId: string,
    @Body() updateStatusRequest: UpdateCourierStatusRequest,
  ): Promise<ApiResponse<CourierProfileData>> {
    const courier = await this.courierService.updateCourierStatus(
      courierId,
      packageId,
      updateStatusRequest,
    );
    return this.apiResponseService.success(
      courier,
      'Courier status updated successfully',
    );
  }

  @Put('location')
  @Roles(UserRole.COURIER)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateLocation(
    @Request() req: AuthenticatedRequest,
    @Body() updateLocationRequest: UpdateLocationRequest,
    @Param('packageId') packageId: string, // <-- add packageId parameter
  ): Promise<ApiResponse<null>> {
    const courierProfileId = req.user.courierProfileId;
    if (!courierProfileId) {
      throw new NotFoundException('Courier profile not found for user');
    }
    await this.courierService.updateCourierLocation(
      courierProfileId,
      packageId, // <-- pass packageId
      updateLocationRequest,
    );
    return this.apiResponseService.success(null, 'Courier location updated');
  }

  @Get('assignments')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COURIER)
  async getAssignments(
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<any>> {
    return this.apiResponseService.success(
      await this.packagesService.getCourierAssignments(req.user.id),
      'Courier assignments retrieved successfully',
    );
  }

  @Patch('packages/:packageId/pickup')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COURIER)
  async markAsPickedUp(
    @Param('packageId') packageId: string,
    @Body() body: { notes?: string },
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<any>> {
    return this.apiResponseService.success(
      await this.packagesService.markAsPickedUp(
        packageId,
        req.user.id,
        body.notes,
      ),
      'Package marked as picked up',
    );
  }
}
