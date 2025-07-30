import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LocationUpdate } from '../../generated/prisma';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  async updateCourierLocation(data: {
    courierId: string;
    packageId: string;
    latitude: number;
    longitude: number;
    address?: string;
    notes?: string;
  }): Promise<LocationUpdate> {
    // Create location update
    const locationUpdate = await this.prisma.locationUpdate.create({
      data: {
        courierId: data.courierId,
        packageId: data.packageId,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        notes: data.notes,
        timestamp: new Date(),
      },
    });

    // Update courier profile
    await this.prisma.courierProfile.update({
      where: { userId: data.courierId }, // <-- use userId, not id
      data: {
        currentLat: data.latitude,
        currentLng: data.longitude,
        lastLocationUpdate: new Date(),
      },
    });

    // Update package current location
    await this.prisma.package.update({
      where: { id: data.packageId },
      data: {
        currentLat: data.latitude,
        currentLng: data.longitude,
      },
    });

    return locationUpdate;
  }

  async getPackageLocationHistory(packageId: string) {
    return this.prisma.locationUpdate.findMany({
      where: { packageId },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getCurrentLocation(courierId: string) {
    return this.prisma.locationUpdate.findFirst({
      where: { courierId },
      orderBy: { timestamp: 'desc' },
    });
  }
}
