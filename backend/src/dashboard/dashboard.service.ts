/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.provider';
import {
  AdminDashboardStats,
  SenderDashboardStats,
  CourierDashboardStats,
} from './interfaces/dashboard.interfaces';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getDashboardStats(): Promise<AdminDashboardStats> {
    const [
      totalPackages,
      activeDeliveries,
      totalUsers,
      totalCouriers,
      availableCouriers,
      todayRevenue,
      weeklyPackages,
      recentPackages,
    ] = await Promise.all([
      this.prisma.package.count(),
      this.prisma.package.count({
        where: {
          status: {
            in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'],
          },
        },
      }),
      this.prisma.user.count({ where: { role: 'SENDER' } }),
      this.prisma.user.count({ where: { role: 'COURIER' } }),
      this.prisma.user.count({
        where: {
          role: 'COURIER',
          courierProfile: {
            status: 'AVAILABLE',
            isVerified: true,
          },
        },
      }),
      this.calculateTodayRevenue(),
      this.getWeeklyPackageStats(),
      this.getRecentPackages(),
    ]);

    const courierPerformance = await this.getCourierPerformance();

    return {
      totalPackages,
      activeDeliveries,
      totalUsers,
      totalCouriers,
      availableCouriers,
      todayRevenue,
      weeklyPackages,
      recentPackages,
      courierPerformance,
    };
  }

  async getSenderStats(senderId: string): Promise<SenderDashboardStats> {
    const [
      totalPackagesSent,
      deliveredPackages,
      inTransitPackages,
      failedDeliveries,
      totalSpentResult,
      recentPackages,
    ] = await Promise.all([
      // Total packages sent by this sender
      this.prisma.package.count({
        where: { senderId },
      }),

      // Delivered packages
      this.prisma.package.count({
        where: {
          senderId,
          status: 'DELIVERED',
        },
      }),

      // In transit packages
      this.prisma.package.count({
        where: {
          senderId,
          status: {
            in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'],
          },
        },
      }),

      this.prisma.package.count({
        where: {
          senderId,
          status: 'CANCELLED',
        },
      }),

      // Total amount spent
      this.prisma.package.aggregate({
        where: { senderId },
        _sum: {
          price: true,
        },
      }),

      // Recent packages
      this.prisma.package.findMany({
        where: { senderId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          courier: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      }),
    ]);

    const totalSpent = totalSpentResult._sum.price || 0;

    // Calculate average delivery time
    const deliveredWithTimes = await this.prisma.package.findMany({
      where: {
        senderId,
        status: 'DELIVERED',
        actualDeliveryDate: { not: null },
      },
      select: {
        createdAt: true,
        actualDeliveryDate: true,
      },
    });

    const averageDeliveryTime =
      deliveredWithTimes.length > 0
        ? deliveredWithTimes.reduce((acc, pkg) => {
            const deliveryTime =
              new Date(pkg.actualDeliveryDate!).getTime() -
              new Date(pkg.createdAt).getTime();
            return acc + deliveryTime / (1000 * 60 * 60); // Convert to hours
          }, 0) / deliveredWithTimes.length
        : 0;

    // Calculate monthly spending for the last 6 months
    const monthlySpending = await this.getSenderMonthlySpending(senderId);

    // Calculate delivery success rate
    const deliverySuccessRate =
      totalPackagesSent > 0 ? (deliveredPackages / totalPackagesSent) * 100 : 0;

    // Calculate average package value
    const averagePackageValue =
      totalPackagesSent > 0 ? totalSpent / totalPackagesSent : 0;

    // Get top destinations
    const topDestinations = await this.getSenderTopDestinations(senderId);

    return {
      totalPackagesSent,
      totalSpent,
      averageDeliveryTime: Math.round(averageDeliveryTime * 100) / 100,
      deliveredPackages,
      inTransitPackages,
      failedDeliveries,
      recentPackages,
      monthlySpending,
      deliverySuccessRate: Math.round(deliverySuccessRate * 100) / 100,
      averagePackageValue: Math.round(averagePackageValue * 100) / 100,
      topDestinations,
    };
  }

  async getCourierStats(courierId: string): Promise<CourierDashboardStats> {
    const [
      totalDeliveries,
      successfulDeliveries,
      activeDeliveries,
      todayDeliveries,
      totalEarningsResult,
      averageRatingResult,
      recentDeliveries,
    ] = await Promise.all([
      // Total deliveries assigned to this courier
      this.prisma.package.count({
        where: { courierId },
      }),

      // Successful deliveries
      this.prisma.package.count({
        where: {
          courierId,
          status: 'DELIVERED',
        },
      }),

      // Active deliveries
      this.prisma.package.count({
        where: {
          courierId,
          status: {
            in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'],
          },
        },
      }),

      // Today's deliveries
      this.prisma.package.count({
        where: {
          courierId,
          status: 'DELIVERED',
          actualDeliveryDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),

      // Total earnings (assuming courier gets a percentage)
      this.prisma.package.aggregate({
        where: {
          courierId,
          status: 'DELIVERED',
        },
        _sum: {
          price: true,
        },
      }),

      // Average rating from reviews
      this.prisma.review.aggregate({
        where: {
          package: {
            courierId,
          },
        },
        _avg: {
          rating: true,
        },
      }),

      // Recent deliveries
      this.prisma.package.findMany({
        where: { courierId },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          sender: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    const totalEarnings = (totalEarningsResult._sum.price || 0) * 0.1; // Assuming 10% commission
    const averageRating = averageRatingResult._avg.rating || 0;

    // Calculate average delivery time for completed deliveries
    const completedDeliveries = await this.prisma.package.findMany({
      where: {
        courierId,
        status: 'DELIVERED',
        actualDeliveryDate: { not: null },
      },
      select: {
        createdAt: true,
        actualDeliveryDate: true,
      },
    });

    const averageDeliveryTime =
      completedDeliveries.length > 0
        ? completedDeliveries.reduce((acc, pkg) => {
            const deliveryTime =
              new Date(pkg.actualDeliveryDate!).getTime() -
              new Date(pkg.createdAt).getTime();
            return acc + deliveryTime / (1000 * 60 * 60); // Convert to hours
          }, 0) / completedDeliveries.length
        : 0;

    // Calculate delivery success rate
    const deliverySuccessRate =
      totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

    // Get weekly earnings
    const weeklyEarnings = await this.getCourierWeeklyEarnings(courierId);

    // Get performance metrics
    const performanceMetrics =
      await this.getCourierPerformanceMetrics(courierId);

    return {
      totalDeliveries,
      successfulDeliveries,
      activeDeliveries,
      averageRating: Math.round(averageRating * 100) / 100,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      todayDeliveries,
      averageDeliveryTime: Math.round(averageDeliveryTime * 100) / 100,
      deliverySuccessRate: Math.round(deliverySuccessRate * 100) / 100,
      recentDeliveries,
      weeklyEarnings,
      performanceMetrics,
    };
  }

  private async calculateTodayRevenue(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const packages = await this.prisma.package.aggregate({
      where: {
        status: 'DELIVERED',
        actualDeliveryDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        price: true,
      },
    });

    return packages._sum.price || 0;
  }

  private async getWeeklyPackageStats() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);

    const packages = await this.prisma.package.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    // Process data to get daily counts
    const dailyCounts = {};
    const labels: string[] = [];
    const data: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      labels.push(dateStr);

      const dayCount = packages.filter(
        (p) => p.createdAt.toISOString().split('T')[0] === dateStr,
      ).length;

      data.push(dayCount);
    }

    return { labels, data };
  }

  private async getRecentPackages() {
    return this.prisma.package.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        courier: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  private async getCourierPerformance() {
    return this.prisma.user.findMany({
      where: { role: 'COURIER' },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        assignedPackages: {
          where: { status: 'DELIVERED' },
          select: { id: true },
        },
      },
      take: 10,
    });
  }

  private async getSenderMonthlySpending(senderId: string) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5); // Last 6 months

    const monthlyData = await this.prisma.package.groupBy({
      by: ['createdAt'],
      where: {
        senderId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        price: true,
      },
    });

    const labels: string[] = [];
    const data: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthYear = date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
      labels.push(monthYear);

      const monthSpent = monthlyData
        .filter((item) => {
          const itemMonth = new Date(item.createdAt).getMonth();
          const itemYear = new Date(item.createdAt).getFullYear();
          return (
            itemMonth === date.getMonth() && itemYear === date.getFullYear()
          );
        })
        .reduce((sum, item) => sum + (item._sum.price || 0), 0);

      data.push(monthSpent);
    }

    return { labels, data };
  }

  private async getSenderTopDestinations(senderId: string) {
    const destinations = await this.prisma.package.groupBy({
      by: ['receiverCity'],
      where: {
        senderId,
        receiverCity: { not: undefined },
      },
      _count: true,
      orderBy: {
        _count: {
          receiverCity: 'desc',
        },
      },
      take: 5,
    });

    return destinations.map((dest) => ({
      city: dest.receiverCity || 'Unknown',
      count: dest._count,
    }));
  }

  private async getCourierWeeklyEarnings(courierId: string) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6); // Last 7 days

    const dailyEarnings = await this.prisma.package.groupBy({
      by: ['actualDeliveryDate'],
      where: {
        courierId,
        status: 'DELIVERED',
        actualDeliveryDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        price: true,
      },
    });

    const labels: string[] = [];
    const data: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      labels.push(dateStr);

      const dayEarnings = dailyEarnings
        .filter((item) => {
          if (!item.actualDeliveryDate) return false;
          const itemDate = new Date(item.actualDeliveryDate).toDateString();
          return itemDate === date.toDateString();
        })
        .reduce((sum, item) => sum + (item._sum.price || 0) * 0.1, 0); // 10% commission

      data.push(Math.round(dayEarnings * 100) / 100);
    }

    return { labels, data };
  }

  private async getCourierPerformanceMetrics(courierId: string) {
    const [onTimeDeliveries, totalRatings, locationUpdates] = await Promise.all(
      [
        // On-time deliveries (delivered before or on estimated date)
        this.prisma.package.count({
          where: {
            courierId,
            status: 'DELIVERED',
          },
        }),

        // Customer ratings count
        this.prisma.review.count({
          where: {
            package: {
              courierId,
            },
          },
        }),

        this.prisma.locationUpdate.findMany({
          where: {
            package: {
              courierId,
            },
          },
          select: {
            latitude: true,
            longitude: true,
          },
          orderBy: {
            timestamp: 'asc',
          },
        }),
      ],
    );

    // Calculate total distance (simplified - in real app you'd use proper distance calculation)
    let totalDistance = 0;
    for (let i = 1; i < locationUpdates.length; i++) {
      const prev = locationUpdates[i - 1];
      const curr = locationUpdates[i];
      if (prev.latitude && prev.longitude && curr.latitude && curr.longitude) {
        // Simplified distance calculation (should use Haversine formula)
        const distance =
          Math.sqrt(
            Math.pow(curr.latitude - prev.latitude, 2) +
              Math.pow(curr.longitude - prev.longitude, 2),
          ) * 111; // Rough conversion to km
        totalDistance += distance;
      }
    }

    return {
      onTimeDeliveries,
      customerRatings: totalRatings,
      totalDistance: Math.round(totalDistance * 100) / 100,
    };
  }
}
