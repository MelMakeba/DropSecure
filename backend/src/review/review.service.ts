import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  // 1. Create a review for a delivered package
  async createPackageReview(
    userId: string,
    packageId: string,
    rating: number,
    comment?: string,
  ) {
    // Check if package is delivered
    const pkg = await this.prisma.package.findUnique({
      where: { id: packageId },
    });
    if (!pkg || pkg.status !== 'DELIVERED') {
      throw new BadRequestException('Only delivered packages can be reviewed');
    }
    // Check if review already exists
    const existing = await this.prisma.review.findUnique({
      where: { packageId_userId: { packageId, userId } },
    });
    if (existing)
      throw new ForbiddenException('You have already reviewed this package');

    // Create review
    const review = await this.prisma.review.create({
      data: { packageId, userId, rating, comment },
    });

    // Update courier profile rating
    if (pkg.courierId) {
      await this.updateCourierProfileRating(pkg.courierId);
    }

    return review;
  }

  // 2. Get all reviews for a package
  async getPackageReviews(packageId: string) {
    return this.prisma.review.findMany({
      where: { packageId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
  }

  // 3. Get all reviews for a courier (by courierId)
  async getCourierReviews(courierId: string) {
    // Find all packages delivered by this courier
    const packages = await this.prisma.package.findMany({
      where: { courierId },
      select: { id: true },
    });
    const packageIds = packages.map((p) => p.id);
    return this.prisma.review.findMany({
      where: { packageId: { in: packageIds } },
      include: {
        user: { select: { firstName: true, lastName: true } },
        package: true,
      },
    });
  }

  // 4. Update a review (only by reviewer)
  async updateReview(
    reviewId: string,
    userId: string,
    rating: number,
    comment?: string,
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId)
      throw new ForbiddenException('You can only update your own review');

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { rating, comment },
    });

    // Update courier profile rating
    const pkg = await this.prisma.package.findUnique({
      where: { id: review.packageId },
    });
    if (pkg?.courierId) await this.updateCourierProfileRating(pkg.courierId);

    return updated;
  }

  // 5. Calculate average rating for courier and update CourierProfile
  async updateCourierProfileRating(courierId: string) {
    // Find all packages delivered by this courier
    const packages = await this.prisma.package.findMany({
      where: { courierId },
      select: { id: true },
    });
    const packageIds = packages.map((p) => p.id);
    if (packageIds.length === 0) return;

    // Calculate average rating
    const { _avg } = await this.prisma.review.aggregate({
      where: { packageId: { in: packageIds } },
      _avg: { rating: true },
    });

    // Update courier profile
    await this.prisma.courierProfile.updateMany({
      where: { userId: courierId },
      data: { rating: _avg.rating || 0 },
    });
  }
}
