/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { LocationUpdate, PackageStatus } from '../../generated/prisma';

@Injectable()
export class LocationService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

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
      include: {
        package: {
          include: {
            sender: true,
            receiver: true,
          },
        },
      },
    });

    // Update courier profile current location
    await this.prisma.courierProfile.update({
      where: { userId: data.courierId },
      data: {
        currentLat: data.latitude,
        currentLng: data.longitude,
        lastLocationUpdate: new Date(),
      },
    });

    // Update package current location
    const updatedPackage = await this.prisma.package.update({
      where: { id: data.packageId },
      data: {
        currentLat: data.latitude,
        currentLng: data.longitude,
        // Auto-update status to OUT_FOR_DELIVERY when first location update is made
        status: data.packageId
          ? await this.getNextStatus(data.packageId)
          : undefined,
      },
      include: {
        sender: true,
        receiver: true,
        courier: true,
      },
    });

    // Emit event instead of calling gateway directly
    this.eventEmitter.emit('location.updated', {
      packageId: data.packageId,
      courierId: data.courierId,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      timestamp: locationUpdate.timestamp,
      packageDetails: updatedPackage,
    });

    // Create status history entry if status changed
    if (updatedPackage.status === PackageStatus.OUT_FOR_DELIVERY) {
      await this.prisma.statusHistory.create({
        data: {
          packageId: data.packageId,
          status: PackageStatus.OUT_FOR_DELIVERY,
          timestamp: new Date(),
          updatedBy: data.courierId,
          notes: 'Package is now out for delivery - location tracking started',
        },
      });
    }

    return locationUpdate;
  }

  private async getNextStatus(packageId: string): Promise<PackageStatus> {
    const package_ = await this.prisma.package.findUnique({
      where: { id: packageId },
      select: { status: true },
    });

    // Auto-progress status when location updates start
    if (package_?.status === PackageStatus.COURIER_ASSIGNED) {
      return PackageStatus.PICKED_UP;
    } else if (package_?.status === PackageStatus.PICKED_UP) {
      return PackageStatus.OUT_FOR_DELIVERY;
    }

    return package_?.status || PackageStatus.COURIER_ASSIGNED;
  }

  async updatePackageStatus(
    packageId: string,
    courierId: string,
    status: PackageStatus,
    notes?: string,
  ) {
    const updatedPackage = await this.prisma.package.update({
      where: { id: packageId, courierId },
      data: {
        status,
        ...(status === PackageStatus.DELIVERED && { deliveredAt: new Date() }),
      },
      include: {
        sender: true,
        receiver: true,
        courier: true,
      },
    });

    // Create status history
    await this.prisma.statusHistory.create({
      data: {
        packageId,
        status,
        timestamp: new Date(),
        updatedBy: courierId,
        notes,
      },
    });

    // Emit status update event instead of calling gateway directly
    this.eventEmitter.emit('package.status.updated', {
      packageId,
      status,
      timestamp: new Date(),
      packageDetails: updatedPackage,
    });

    return updatedPackage;
  }

  async getPackageLocationHistory(packageId: string) {
    return this.prisma.locationUpdate.findMany({
      where: { packageId },
      include: {
        courier: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getCurrentLocation(courierId: string) {
    return this.prisma.locationUpdate.findFirst({
      where: { courierId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getActivePackageLocation(packageId: string) {
    return this.prisma.locationUpdate.findFirst({
      where: { packageId },
      orderBy: { timestamp: 'desc' },
      include: {
        courier: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}
