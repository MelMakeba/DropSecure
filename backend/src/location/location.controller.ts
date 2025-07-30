import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('update')
  async updateCourierLocation(
    @Body()
    body: {
      courierId: string;
      packageId: string;
      latitude: number;
      longitude: number;
      address?: string;
      notes?: string;
    },
  ) {
    // Validate coordinates here if needed
    return this.locationService.updateCourierLocation(body);
  }

  @Get('package/:packageId')
  async getPackageLocationHistory(@Param('packageId') packageId: string) {
    return this.locationService.getPackageLocationHistory(packageId);
  }

  @Get('courier/:courierId/current')
  async getCurrentLocation(@Param('courierId') courierId: string) {
    return this.locationService.getCurrentLocation(courierId);
  }
}
