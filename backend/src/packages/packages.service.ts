/* eslint-disable @typescript-eslint/require-await */

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
   * Create a package by admin (with sender lookup by email)
   */
  async createPackageByAdmin(dto: CreatePackageDto, adminId: string) {
    // Look up sender by email
    const sender = await this.prisma.user.findUnique({
      where: { email: dto.senderEmail },
    });

    if (!sender) {
      throw new NotFoundException(
        `Sender not found with email: ${dto.senderEmail}`,
      );
    }

    if (sender.role !== 'SENDER') {
      throw new BadRequestException('Selected user is not a sender');
    }

    // Generate tracking ID
    const trackingId = this.generateTrackingId();

    // Calculate estimated cost
    const estimatedCost = await this.calculatePackageCost(dto.weight, 0);

    const packageData = await this.prisma.package.create({
      data: {
        ...dto,
        senderId: sender.id,
        trackingId,
        estimatedCost,
        price: dto.price || estimatedCost,
        createdById: adminId,
        status: 'CREATED',
        preferredPickupDate: dto.preferredPickupDate
          ? new Date(dto.preferredPickupDate)
          : null,
        preferredDeliveryDate: dto.preferredDeliveryDate
          ? new Date(dto.preferredDeliveryDate)
          : null,
      },
      include: {
        sender: true,
        statusHistory: true,
      },
    });

    // Create initial status history
    await this.prisma.packageStatusHistory.create({
      data: {
        packageId: packageData.id,
        status: 'CREATED',
        notes: 'Package created by admin',
        changedBy: adminId,
        changedAt: new Date(),
        createdAt: new Date(),
      },
    });

    // Send notifications
    await this.sendPackageCreationNotifications(packageData);

    return packageData;
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

    if (userRole === UserRole.SENDER) {
      whereClause.senderId = userId;
    } else if (userRole === UserRole.COURIER) {
      whereClause.courierId = userId;
    }
    // Admin: no filter

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
          orderBy: { timestamp: 'desc' },
          include: {
            updatedByUser: {
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
          orderBy: { timestamp: 'desc' },
          select: {
            id: true,
            status: true,
            timestamp: true,
            notes: true,
            location: true,
            updatedByUser: {
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
          changedBy: changedBy,
          changedAt: new Date(), // <-- Keep this if it's a field you create
          createdAt: new Date(),
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
    const fullPackage = await this.prisma.package.findUnique({
      where: { id: packageId },
      include: {
        sender: true,
        receiver: true,
        createdBy: true,
        courier: true,
        statusHistory: {
          orderBy: { timestamp: 'desc' },
          include: {
            updatedByUser: {
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
    if (fullPackage) {
      await this.sendStatusUpdateEmail(
        fullPackage as unknown as PackageWithRelations,
        updateStatusDto.status,
      );
    }

    this.logger.log(
      `Package ${existingPackage.trackingId} status updated to ${updateStatusDto.status}`,
    );
    return updatedPackage;
  }

  /**
   * Assign a courier to a package
   */
  async assignCourierToPackage(
    packageId: string,
    courierId: string,
    assignedBy: string,
  ): Promise<PackageInterface> {
    // Validate package exists
    const pkg = await this.prisma.package.findUnique({
      where: { id: packageId },
    });
    if (!pkg) throw new NotFoundException('Package not found');

    // Validate courier exists and is a COURIER
    const courier = await this.prisma.user.findUnique({
      where: { id: courierId },
      select: { id: true, role: true, email: true, firstName: true },
    });
    if (!courier || courier.role !== UserRole.COURIER) {
      throw new BadRequestException('Courier not found or invalid role');
    }

    // Update package with courier and status
    const updatedPackage = await this.prisma.package.update({
      where: { id: packageId },
      data: {
        courier: { connect: { id: courierId } },
        status: PackageStatus.COURIER_ASSIGNED,
        updatedAt: new Date(),
      },
    });

    // Add status history
    await this.prisma.packageStatusHistory.create({
      data: {
        packageId,
        status: PackageStatus.COURIER_ASSIGNED,
        changedBy: assignedBy,
        changedAt: new Date(),
        notes: 'Courier assigned to package',
        createdAt: new Date(),
      },
    });

    // Notify courier (optional)
    await this.prisma.notification.create({
      data: {
        recipientUserId: courierId,
        packageId,
        type: 'COURIER_ASSIGNED',
        subject: 'New Package Assignment',
        message: `You have been assigned a new package (${pkg.trackingId})`,
      },
    });

    // Optionally send email to courier
    await this.emailService.sendPackageAssignmentEmail(courier.email, {
      courierName: courier.firstName,
      trackingNumber: pkg.trackingId,
      packageDetails: pkg.description,
      pickupAddress: pkg.receiverAddress,
      deliveryAddress: pkg.receiverAddress,
      receiverPhone: pkg.receiverPhone,
      senderPhone: '',
    });

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

  /**
   * Get received packages by user
   */
  async getReceivedPackages(
    userEmail: string,
    query: PackageQueryDto,
  ): Promise<{
    packages: PackageInterface[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause for packages where user is receiver
    const whereClause: Prisma.PackageWhereInput = {
      receiverEmail: userEmail,
    };

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { trackingId: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
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
            },
          },
          courier: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      }),
      this.prisma.package.count({ where: whereClause }),
    ]);

    return { packages, total, page, limit };
  }

  /**
   * Cancel a package
   */
  async cancelPackage(
    packageId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<PackageInterface> {
    const pkg = await this.prisma.package.findUnique({
      where: { id: packageId },
      include: { sender: true },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    if (userRole !== UserRole.ADMIN && pkg.senderId !== userId) {
      throw new ForbiddenException('Not authorized to cancel this package');
    }

    const cancellableStatuses = [
      PackageStatus.CREATED,
      PackageStatus.COURIER_ASSIGNED,
    ];

    if (
      !cancellableStatuses.includes(
        pkg.status as (typeof cancellableStatuses)[number],
      )
    ) {
      throw new BadRequestException(
        `Cannot cancel package with status: ${pkg.status}`,
      );
    }

    // Update package status
    const cancelledPackage = await this.prisma.package.update({
      where: { id: packageId },
      data: {
        status: PackageStatus.CANCELLED,
        updatedAt: new Date(),
      },
    });

    // Add status history
    await this.prisma.packageStatusHistory.create({
      data: {
        packageId,
        status: PackageStatus.CANCELLED,
        changedBy: userId,
        changedAt: new Date(),
        createdAt: new Date(),
        notes: 'Package cancelled by user',
      },
    });

    return cancelledPackage;
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
    packageData: PackageWithRelations,
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

      // Send to sender
      if (packageData.sender?.email) {
        const senderName = packageData.sender.name; // Use 'name' property
        if (newStatus === PackageStatus.PICKED_UP) {
          await this.emailService.sendPickupConfirmation(
            packageData.sender.email,
            {
              name: senderName,
              trackingNumber: packageData.trackingId,
              pickupTime: new Date().toISOString(),
              courierName: 'DropSecure Courier',
            },
          );
        } else if (newStatus === PackageStatus.DELIVERED) {
          await this.emailService.sendDeliveryNotification(
            packageData.sender.email,
            {
              name: senderName,
              trackingNumber: packageData.trackingId,
              deliveryTime: new Date().toISOString(),
            },
          );
        } else {
          // Use an existing generic status update method, or implement one
          await this.emailService.sendPackageStatusUpdate(
            packageData.sender.email,
            {
              name: packageData.sender.name,
              trackingNumber: packageData.trackingId,
              oldStatus: packageData.status,
              newStatus,
              statusMessage: message,
            },
          );
        }
      }

      // Send to receiver (if available)
      if (packageData.receiver?.email) {
        const receiverName = packageData.receiver.name; // Use 'name' property
        await this.emailService.sendPackageStatusUpdate(
          packageData.receiver.email,
          {
            name: receiverName,
            trackingNumber: packageData.trackingId,
            oldStatus: packageData.status,
            newStatus,
            statusMessage: message,
          },
        );
      }

      this.logger.log(`Package ${packageData.trackingId} ${message}`);
    } catch (error) {
      this.logger.error(`Failed to send status update email: ${error.message}`);
    }
  }

  private async sendPackageCreationNotifications(packageData: any) {
    try {
      // Email to sender
      await this.emailService.sendPackageCreatedEmail(
        String(packageData.sender.email),
        {
          name: `${packageData.sender.firstName} ${packageData.sender.lastName}`,
          trackingNumber: packageData.trackingId,
          receiverName: packageData.receiverName,
          estimatedDelivery: packageData.preferredDeliveryDate,
          packageDetails: '',
          price: 0,
        },
      );

      // Email to receiver
      await this.emailService.sendPackageIncomingNotification(
        String(packageData.receiverEmail),
        {
          receiverName: packageData.receiverName,
          trackingNumber: packageData.trackingId,
          senderName: `${packageData.sender.firstName} ${packageData.sender.lastName}`,
          estimatedDeliveryDate: packageData.preferredDeliveryDate,
          packageDescription: packageData.description,
        },
      );
    } catch (error) {
      console.error('Failed to send package creation notifications:', error);
      // Don't throw error as package creation was successful
    }
  }
}
