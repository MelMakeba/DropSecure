import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update_profile.dto';
import { User, UserRole, Prisma, $Enums } from '../../generated/prisma';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    if (!data.email || !data.password)
      throw new BadRequestException('Email and password required');
    return await this.prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
    });
    return user;
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return await this.prisma.user.findMany({ where: { role } });
  }

  async findAll(): Promise<User[]> {
    return await this.prisma.user.findMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async getUserById(id: string): Promise<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: UserRole;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    country: string | null;
    isEmailVerified: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        isEmailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password for security
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getAllUsers(query: {
    page: number;
    limit: number;
    role: $Enums.UserRole | undefined;
    search: string | undefined;
  }): Promise<{
    users: Prisma.UserGetPayload<{
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
        phone: true;
        role: true;
        address: true;
        city: true;
        state: true;
        zipCode: true;
        country: true;
        isEmailVerified: true;
        isActive: true;
        createdAt: true;
        updatedAt: true;
      };
    }>[]; // <-- Use this type
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, role, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Prisma.UserWhereInput = {};

    if (role) {
      whereClause.role = role;
    }

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          isEmailVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          // Exclude password for security
        },
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    return { users, total, page, limit };
  }
}
