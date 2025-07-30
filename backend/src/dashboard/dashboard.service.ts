/* eslint-disable @typescript-eslint/require-await */
import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.provider';
import {
  PackageStatusCount,
  RevenueMetrics,
  CourierPerformance,
  PackageMetrics,
  UserStats,
  ReportResult,
} from './interfaces/dashboard.interfaces';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}
  async getDeliveryStats(): Promise<{
    counts: PackageStatusCount[];
    successRate: number;
  }> {
    const [counts, successCount, total] = await Promise.all([
      this.prisma.package.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.package.count({ where: { status: 'DELIVERED' } }),
      this.prisma.package.count(),
    ]);
    return {
      counts,
      successRate: total ? (successCount / total) * 100 : 0,
    };
  }

  async getRevenueMetrics(): Promise<RevenueMetrics> {
    const cacheKey = 'dashboard:revenueMetrics';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as RevenueMetrics;

    const [sum, avg] = await Promise.all([
      this.prisma.package.aggregate({ _sum: { estimatedCost: true } }),
      this.prisma.package.aggregate({ _avg: { estimatedCost: true } }),
    ]);
    const result: RevenueMetrics = {
      totalRevenue: sum._sum.estimatedCost || 0,
      avgPackageValue: avg._avg.estimatedCost || 0,
    };
    await this.redis.setex(cacheKey, 60, JSON.stringify(result));
    return result;
  }

  async getCourierPerformance(): Promise<CourierPerformance[]> {
    const users = await this.prisma.user.findMany({
      where: { role: 'COURIER' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        assignedPackages: {
          // <-- correct relation from schema
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      courierPackages: user.assignedPackages, // <-- match interface
    }));
  }

  async getPackageMetrics({
    from,
    to,
  }: {
    from?: Date;
    to?: Date;
  }): Promise<PackageMetrics[]> {
    const where: Record<string, unknown> = {};
    if (from && to) where.createdAt = { gte: from, lte: to };

    const packages = await this.prisma.package.findMany({
      where,
      select: {
        id: true,
        receiverAddress: true,
        receiverCity: true,
        createdAt: true,
        updatedAt: true,
        statusHistory: {
          // <-- correct relation from schema
          select: {
            status: true,
            changedAt: true,
            notes: true,
          },
        },
      },
    });

    return packages.map((pkg) => ({
      id: pkg.id,
      receiverAddress: pkg.receiverAddress,
      receiverCity: pkg.receiverCity,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
      packageStatusHistory: pkg.statusHistory, // <-- match interface
    }));
  }

  async getUserStats(): Promise<UserStats> {
    const [total, byRole, active] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);
    return { total, byRole, active };
  }

  async getReports({
    from,
    to,
    page = 1,
    pageSize = 20,
  }: {
    from?: Date;
    to?: Date;
    page?: number;
    pageSize?: number;
  }): Promise<ReportResult> {
    const where: Record<string, unknown> = {};
    if (from && to) where.createdAt = { gte: from, lte: to };

    const [data, total] = await Promise.all([
      this.prisma.package.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          courier: true,
          sender: true,
          ...((await this.checkReceiverRelation()) && { receiver: true }),
        },
      }),
      this.prisma.package.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  private async checkReceiverRelation(): Promise<boolean> {
    try {
      return true;
    } catch {
      return false;
    }
  }
}
