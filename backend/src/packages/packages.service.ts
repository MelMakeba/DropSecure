/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PackageStatus, UserRole, Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../shared/mailer/email.service';
import {
  CreatePackageDto,
  UpdatePackageStatusDto,
  UpdatePackageLocationDto,
  PackageQueryDto,
} from './dto/package.dto';
import {
  PackageInterface,
  PackageWithRelations,
} from './interfaces/package.interfaces';
import { nanoid } from 'nanoid';

@Injectable()
export class PackageService {
  private readonly logger = new Logger(PackageService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Create a new package (Admin only)
   */
  async createPackage(
    createPackageDto: CreatePackageDto,
    createdById: string,
  ): Promise<PackageInterface> {
    try {
      // Validate sender exists (always required)
      const sender = await this.prisma.user.findUnique({
        where: { id: createPackageDto.senderId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      });

      if (!sender) {
        throw new NotFoundException('Sender not found');
      }

      // Validate receiver if receiverId is provided (optional)
      let receiver: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: UserRole;
      } | null = null;
      if (createPackageDto.receiverId) {
        receiver = await this.prisma.user.findUnique({
          where: { id: createPackageDto.receiverId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        });

        if (!receiver) {
          throw new NotFoundException('Receiver not found');
        }
      }

      // Validate courier if courierId is provided
      if (createPackageDto.courierId) {
        const courier = await this.prisma.user.findFirst({
          where: {
            id: createPackageDto.courierId,
            role: UserRole.COURIER,
          },
        });

        if (!courier) {
          throw new NotFoundException('Courier not found or invalid role');
        }
      }

      // Generate unique tracking ID
      const trackingId = this.generateTrackingId();

      // Calculate estimated cost (placeholder logic)
      const estimatedCost = this.calculateEstimatedCost(
        createPackageDto.weight,
        createPackageDto.price,
      );

      // Create package with transaction
      const packageData = await this.prisma.$transaction(async (tx) => {
        const newPackage = await tx.package.create({
          data: {
            trackingId,
            senderId: createPackageDto.senderId,
            senderEmail: createPackageDto.senderEmail,
            receiverId: createPackageDto.receiverId, // can be null
            receiverName: createPackageDto.receiverName,
            receiverEmail: createPackageDto.receiverEmail,
            receiverPhone: createPackageDto.receiverPhone,
            receiverAddress: createPackageDto.receiverAddress,
            receiverCity: createPackageDto.receiverCity,
            receiverState: createPackageDto.receiverState,
            receiverZipCode: createPackageDto.receiverZipCode,
            receiverCountry: createPackageDto.receiverCountry,
            createdById,
            weight: createPackageDto.weight,
            description: createPackageDto.description,
            specialInstructions: createPackageDto.specialInstructions,
            value: createPackageDto.value,
            price: createPackageDto.price,
            preferredPickupDate: createPackageDto.preferredPickupDate
              ? new Date(createPackageDto.preferredPickupDate)
              : null,
            preferredDeliveryDate: createPackageDto.preferredDeliveryDate
              ? new Date(createPackageDto.preferredDeliveryDate)
              : null,
            courierId: createPackageDto.courierId,
            estimatedCost,
            status: PackageStatus.CREATED,
          },
        });

        // Create initial status history
        await tx.packageStatusHistory.create({
          data: {
            packageId: newPackage.id,
            status: PackageStatus.CREATED,
            changedBy: createdById,
            changedAt: new Date(),
            notes: 'Package created',
          },
        });

        // Create notification for sender
        await tx.notification.create({
          data: {
            recipientUserId: createPackageDto.senderId, // <-- use the correct field name
            packageId: newPackage.id,
            type: 'PACKAGE_CREATED',
            subject: 'Package Created',
            message: `Your package with tracking ID ${trackingId} has been created`,
          },
        });

        return newPackage;
      });

      // Send package creation email to sender
      await this.emailService.sendPackageCreatedEmail(
        createPackageDto.senderEmail,
        {
          name: sender.firstName,
          trackingNumber: trackingId,
          packageDetails: `${createPackageDto.description} (${createPackageDto.weight}kg)`,
          receiverName: createPackageDto.receiverName,
          price: createPackageDto.price,
          specialInstructions: createPackageDto.specialInstructions,
        },
      );

      this.logger.log(`Package created successfully: ${trackingId}`);
      return packageData;
    } catch (error) {
      this.logger.error(`Failed to create package: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get packages by user (based on role)
   */
  async getPackagesByUser(
    userId: string,
    userRole: UserRole,
    query: PackageQueryDto,
  ): Promise<{
    packages: PackageInterface[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      courierId,
      startDate,
      endDate,
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause based on user role
    const whereClause: Prisma.PackageWhereInput = {};

    switch (userRole) {
      case UserRole.ADMIN:
        // Admin can see all packages
        break;
      case UserRole.SENDER:
        whereClause.senderId = userId;
        break;
      case UserRole.COURIER:
        whereClause.courierId = userId;
        break;
      default:
        // If you want to allow a user to see packages where they are the receiver:
        whereClause.receiverId = userId;
        break;
    }

    // Add additional filters
    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { trackingId: { contains: search, mode: 'insensitive' } },
        { receiverName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (courierId) {
      whereClause.courierId = courierId;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [packages, total] = await Promise.all([
      this.prisma.package.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          courier: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      this.prisma.package.count({ where: whereClause }),
    ]);

    return {
      packages,
      total,
      page,
      limit,
    };
  }

  /**
   * Get package by ID with full relations
   */
  async getPackageById(
    packageId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<PackageWithRelations> {
    const packageData = await this.prisma.package.findUnique({
      where: { id: packageId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        courier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        statusHistory: {
          orderBy: { changedAt: 'desc' },
          include: {
            changedByUser: {
              select: { id: true, firstName: true, email: true },
            },
          },
        },
        locationUpdates: {
          orderBy: { timestamp: 'desc' },
          include: {
            courier: {
              select: { id: true, firstName: true, email: true },
            },
          },
        },
        deliveryAttempts: {
          orderBy: { attemptDate: 'desc' },
          include: {
            courier: {
              select: { id: true, firstName: true, email: true },
            },
          },
        },
      },
    });

    if (!packageData) {
      throw new NotFoundException('Package not found');
    }

    // Check access permissions
    await this.checkPackageAccess(packageData, userId, userRole);

    return packageData as unknown as PackageWithRelations;
  }

  /**
   * Get package by tracking ID (public access)
   */
  async getPackageByTrackingId(
    trackingId: string,
  ): Promise<PackageWithRelations> {
    const packageData = await this.prisma.package.findUnique({
      where: { trackingId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: false,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: false,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: false,
            role: true,
          },
        },
        courier: {
          select: { id: true, firstName: true, email: false, phone: false },
        },
        statusHistory: {
          orderBy: { changedAt: 'desc' },
          select: {
            id: true,
            status: true,
            changedAt: true,
            notes: true,
            location: true,
            changedByUser: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        locationUpdates: {
          orderBy: { timestamp: 'desc' },
          take: 10,
          select: {
            id: true,
            latitude: true,
            longitude: true,
            address: true,
            timestamp: true,
          },
        },
        deliveryAttempts: {
          orderBy: { attemptDate: 'desc' },
          select: {
            id: true,
            attemptNumber: true,
            attemptDate: true,
            notes: true,
          },
        },
      },
    });

    if (!packageData) {
      throw new NotFoundException('Package not found');
    }

    return packageData as unknown as PackageWithRelations;
  }

  /**
   * Update package status
   */
  async updatePackageStatus(
    packageId: string,
    updateStatusDto: UpdatePackageStatusDto,
    changedBy: string,
  ): Promise<PackageInterface> {
    const existingPackage = await this.prisma.package.findUnique({
      where: { id: packageId },
      include: {
        sender: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!existingPackage) {
      throw new NotFoundException('Package not found');
    }

    // Validate status transition
    this.validateStatusTransition(
      existingPackage.status,
      updateStatusDto.status,
    );

    const updatedPackage = await this.prisma.$transaction(async (tx) => {
      // Update package status and location if provided
      const updateData: Prisma.PackageUpdateInput = {
        status: updateStatusDto.status,
        updatedAt: new Date(),
      };

      if (updateStatusDto.latitude && updateStatusDto.longitude) {
        updateData.currentLat = updateStatusDto.latitude;
        updateData.currentLng = updateStatusDto.longitude;
      }

      // Set actual dates based on status
      if (
        updateStatusDto.status === PackageStatus.PICKED_UP &&
        !existingPackage.actualPickupDate
      ) {
        updateData.actualPickupDate = new Date();
      }

      if (
        updateStatusDto.status === PackageStatus.DELIVERED &&
        !existingPackage.actualDeliveryDate
      ) {
        updateData.actualDeliveryDate = new Date();
      }

      const updatedPkg = await tx.package.update({
        where: { id: packageId },
        data: updateData,
      });

      // Create status history record
      await tx.packageStatusHistory.create({
        data: {
          packageId,
          status: updateStatusDto.status,
          changedBy,
          changedAt: new Date(),
          notes: updateStatusDto.notes,
          location: updateStatusDto.location,
        },
      });

      // Create location update if coordinates provided
      if (updateStatusDto.latitude && updateStatusDto.longitude) {
        await tx.locationUpdate.create({
          data: {
            packageId,
            latitude: updateStatusDto.latitude,
            longitude: updateStatusDto.longitude,
            address: updateStatusDto.location,
            timestamp: new Date(),
            courierId: changedBy,
          },
        });
      }

      // Create notification for sender
      await tx.notification.create({
        data: {
          recipientUserId: existingPackage.senderId,
          packageId,
          type: 'STATUS_UPDATE',
          subject: 'Package Status Updated',
          message: `Your package ${existingPackage.trackingId} status has been updated to ${updateStatusDto.status}`,
        },
      });

      return updatedPkg;
    });

    // Send status update email to sender
    await this.sendStatusUpdateEmail(existingPackage, updateStatusDto.status);

    this.logger.log(
      `Package ${existingPackage.trackingId} status updated to ${updateStatusDto.status}`,
    );
    return updatedPackage;
  }

  /**
   * Calculate package cost using pricing rules
   */
  async calculatePackageCost(
    weight: number,
    distance: number,
    priority: string = 'STANDARD',
  ): Promise<number> {
    try {
      const pricingRule = await this.prisma.pricingRule.findFirst({
        where: {
          isActive: true,
          minWeight: { lte: weight },
          maxWeight: { gte: weight },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!pricingRule) {
        // Fallback calculation if no pricing rule found
        return this.calculateEstimatedCost(weight, 10); // Default base price
      }

      let cost = pricingRule.baseCost;

      // Add weight-based cost
      if (weight > (pricingRule.minWeight ?? 0)) {
        const extraWeight = weight - (pricingRule.minWeight ?? 0);
        cost += extraWeight * pricingRule.costPerKg;
      }

      // Add distance-based cost
      if (distance > 0) {
        cost += distance * (pricingRule.costPerKm || 0.5);
      }

      // Apply priority multiplier
      if (priority === 'EXPRESS') {
        cost *= 1.5;
      } else if (priority === 'URGENT') {
        cost *= 2.0;
      }

      return Math.round(cost * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      this.logger.error(`Failed to calculate package cost: ${error.message}`);
      return this.calculateEstimatedCost(weight, 10);
    }
  }

  /**
   * Update package location
   */
  async updatePackageLocation(
    packageId: string,
    locationDto: UpdatePackageLocationDto,
    updatedBy: string,
  ): Promise<void> {
    const packageExists = await this.prisma.package.findUnique({
      where: { id: packageId },
      select: { id: true, trackingId: true },
    });

    if (!packageExists) {
      throw new NotFoundException('Package not found');
    }

    await this.prisma.$transaction(async (tx) => {
      // Update package current location
      await tx.package.update({
        where: { id: packageId },
        data: {
          currentLat: locationDto.latitude,
          currentLng: locationDto.longitude,
        },
      });

      // Create location update record
      await tx.locationUpdate.create({
        data: {
          packageId,
          latitude: locationDto.latitude,
          longitude: locationDto.longitude,
          address: locationDto.address,
          timestamp: new Date(),
          courierId: updatedBy,
        },
      });
    });

    this.logger.log(`Location updated for package ${packageExists.trackingId}`);
  }

  // Private helper methods

  private generateTrackingId(): string {
    const prefix = 'DS'; // DropSecure prefix
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = nanoid(6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  private calculateEstimatedCost(weight: number, basePrice: number): number {
    const baseCost = basePrice;
    const weightCost = weight * 2; // $2 per kg
    return Math.round((baseCost + weightCost) * 100) / 100;
  }

  private validateStatusTransition(
    currentStatus: PackageStatus,
    newStatus: PackageStatus,
  ): void {
    const validTransitions: Record<PackageStatus, PackageStatus[]> = {
      [PackageStatus.CREATED]: [
        PackageStatus.COURIER_ASSIGNED,
        PackageStatus.CANCELLED,
      ],
      [PackageStatus.COURIER_ASSIGNED]: [
        PackageStatus.PICKED_UP,
        PackageStatus.CANCELLED,
      ],
      [PackageStatus.PICKED_UP]: [
        PackageStatus.IN_TRANSIT,
        PackageStatus.DELIVERED,
        PackageStatus.FAILED_DELIVERY,
      ],
      [PackageStatus.IN_TRANSIT]: [
        PackageStatus.OUT_FOR_DELIVERY,
        PackageStatus.DELIVERED,
        PackageStatus.FAILED_DELIVERY,
      ],
      [PackageStatus.OUT_FOR_DELIVERY]: [
        PackageStatus.DELIVERED,
        PackageStatus.FAILED_DELIVERY,
      ],
      [PackageStatus.DELIVERED]: [],
      [PackageStatus.FAILED_DELIVERY]: [
        PackageStatus.COURIER_ASSIGNED,
        PackageStatus.CANCELLED,
      ],
      [PackageStatus.CANCELLED]: [],
      [PackageStatus.RETURNED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private async checkPackageAccess(
    packageData: any,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    if (userRole === UserRole.ADMIN) {
      return; // Admin has access to all packages
    }

    const hasAccess =
      packageData.senderId === userId ||
      packageData.receiverId === userId ||
      packageData.courierId === userId ||
      packageData.createdById === userId;

    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this package');
    }
  }

  private async getUserEmail(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email || '';
  }

  private async sendStatusUpdateEmail(
    packageData: any,
    newStatus: PackageStatus,
  ): Promise<void> {
    try {
      const statusMessages = {
        [PackageStatus.COURIER_ASSIGNED]:
          'has been assigned and is ready for pickup',
        [PackageStatus.PICKED_UP]: 'has been picked up by our courier',
        [PackageStatus.IN_TRANSIT]: 'is now in transit',
        [PackageStatus.OUT_FOR_DELIVERY]: 'is out for delivery',
        [PackageStatus.DELIVERED]: 'has been successfully delivered',
        [PackageStatus.CANCELLED]: 'has been cancelled',
        [PackageStatus.FAILED_DELIVERY]: 'delivery has failed',
        [PackageStatus.RETURNED]: 'has been returned',
      };
      const message = statusMessages[newStatus];
      // Send email based on status
      if (newStatus === PackageStatus.PICKED_UP) {
        await this.emailService.sendPickupConfirmation(
          packageData.sender.email,
          {
            name: packageData.sender.name,
            trackingNumber: packageData.trackingId,
            pickupTime: new Date().toISOString(),
            courierName: 'DropSecure Courier',
          },
        );
      } else if (newStatus === PackageStatus.DELIVERED) {
        await this.emailService.sendDeliveryNotification(
          packageData.sender.email,
          {
            name: packageData.sender.name,
            trackingNumber: packageData.trackingId,
            deliveryTime: new Date().toISOString(),
          },
        );
      }
      this.logger.log(`Package ${packageData.trackingId} ${message}`);
    } catch (error) {
      this.logger.error(`Failed to send status update email: ${error.message}`);
    }
  }
}
