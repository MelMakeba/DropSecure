/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CourierProfileData,
  CourierProfileWithStats,
  CourierStats,
  UpdateCourierStatusRequest,
  UpdateLocationRequest,
} from './interfaces/courier.interfaces';
import {
  CourierStatus,
  DeliveryAttemptStatus,
  UserRole,
} from '../../generated/prisma';

@Injectable()
export class CourierService {
  private readonly logger = new Logger(CourierService.name);

  constructor(private prisma: PrismaService) {}

  private transformCourierProfile(courier: {
    licenseNumber?: string | null;
    vehicleType?: string | null;
    vehicleNumber?: string | null;
    currentLat?: number | null;
    currentLng?: number | null;
    lastLocationUpdate?: Date | null;
    rating?: number | null;
    totalDeliveries?: number | null;
    isVerified?: boolean | null;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string | null;
      password: string;
      role: UserRole;
      isEmailVerified: boolean;
      isActive: boolean;
    };
  }): CourierProfileData {
    const { password, ...userWithoutPassword } = courier.user;
    return {
      ...userWithoutPassword,
      password: password, // Add password to satisfy CourierProfileData
      role: userWithoutPassword.role,
      phone: userWithoutPassword.phone ?? '',
      licenseNumber: courier.licenseNumber ?? undefined,
      vehicleType: courier.vehicleType ?? undefined,
      vehicleNumber: courier.vehicleNumber ?? undefined,
      currentLat: courier.currentLat ?? undefined,
      currentLng: courier.currentLng ?? undefined,
      lastLocationUpdate: courier.lastLocationUpdate ?? undefined,
      rating: courier.rating ?? undefined,
      totalDeliveries: courier.totalDeliveries ?? 0,
      isVerified: courier.isVerified ?? false,
      createdAt: courier.createdAt,
      updatedAt: courier.updatedAt,
    };
  }

  async getCourierProfile(userId: string): Promise<CourierProfileWithStats> {
    const courier = await this.prisma.courierProfile.findUnique({
      where: { userId }, // <-- use userId, not courierProfileId
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            password: true, // Add this
            role: true, // Add this
            isEmailVerified: true, // Add this
            isActive: true, // Add this
          },
        },
      },
    });

    if (!courier) {
      throw new NotFoundException('Courier profile not found');
    }

    const stats = await this.getCourierStats(userId);
    const transformedCourier = this.transformCourierProfile(courier);

    return {
      ...transformedCourier,
      stats,
    };
  }

  async getAllCouriers(): Promise<CourierProfileData[]> {
    const couriers = await this.prisma.courierProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            password: true,
            role: true,
            isEmailVerified: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return couriers.map((c) => this.transformCourierProfile(c));
  }

  async getAvailableCouriers(): Promise<CourierProfileData[]> {
    const couriers = await this.prisma.courierProfile.findMany({
      where: {
        status: CourierStatus.AVAILABLE,
        isVerified: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            password: true,
            role: true,
            isEmailVerified: true,
            isActive: true,
          },
        },
      },
      orderBy: [{ rating: 'desc' }, { totalDeliveries: 'desc' }],
    });

    return couriers.map((c) => this.transformCourierProfile(c));
  }

  async verifyCourier(courierId: string): Promise<CourierProfileData> {
    const courier = await this.prisma.courierProfile.update({
      where: { id: courierId },
      data: { isVerified: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            password: true,
            role: true,
            isEmailVerified: true,
            isActive: true,
          },
        },
      },
    });

    return this.transformCourierProfile(courier);
  }

  async updateCourierStatus(
    courierId: string,
    packageId: string,
    request: UpdateCourierStatusRequest,
  ): Promise<CourierProfileData> {
    const updateData = {
      status: request.status,
      lastLocationUpdate: new Date(),
      ...(request.currentLat !== undefined &&
        request.currentLng !== undefined && {
          currentLat: request.currentLat,
          currentLng: request.currentLng,
        }),
    };

    const updatedCourier = await this.prisma.courierProfile.update({
      where: { id: courierId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            password: true,
            role: true,
            isEmailVerified: true,
            isActive: true,
          },
        },
      },
    });

    try {
      if (
        request.currentLat !== undefined &&
        request.currentLng !== undefined
      ) {
        const data: any = {
          courierId,
          latitude: request.currentLat,
          longitude: request.currentLng,
          timestamp: new Date(),
        };

        if (packageId) {
          data.package = { connect: { id: packageId } };
        }

        await this.prisma.locationUpdate.create({ data });
      }
    } catch (error) {
      this.logger.error(
        `Failed to update location for courierId=${courierId}, packageId=${packageId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }

    return this.transformCourierProfile(updatedCourier);
  }

  async updateCourierLocation(
    courierId: string,
    packageId: string | undefined,
    request: UpdateLocationRequest,
  ): Promise<void> {
    try {
      const { currentLat, currentLng } = request;
      await this.prisma.$transaction(async (tx) => {
        await tx.courierProfile.update({
          where: { id: courierId },
          data: {
            currentLat,
            currentLng,
            lastLocationUpdate: new Date(),
          },
        });

        let locationData: any = {
          courierId,
          latitude: currentLat,
          longitude: currentLng,
          timestamp: new Date(),
        };
        if (packageId) {
          locationData.package = { connect: { id: packageId } };
        }
        await tx.locationUpdate.create({ data: locationData });
      });
    } catch (error) {
      this.logger.error(
        `Failed to update courier location for courierId=${courierId}, packageId=${packageId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async getCourierStats(courierId: string): Promise<CourierStats> {
    const deliveryAttempts = await this.prisma.deliveryAttempt.findMany({
      where: { courierId },
    });

    const totalDeliveries = deliveryAttempts.length;
    const successfulDeliveries = deliveryAttempts.filter(
      (attempt) => attempt.status === DeliveryAttemptStatus.SUCCESSFUL,
    ).length;
    const failedDeliveries = totalDeliveries - successfulDeliveries;

    const courier = await this.prisma.courierProfile.findUnique({
      where: { id: courierId },
      select: { rating: true, totalDeliveries: true },
    });

    return {
      totalDeliveries: courier?.totalDeliveries || 0,
      successfulDeliveries,
      failedDeliveries,
      rating: courier?.rating || 0,
    };
  }
}
