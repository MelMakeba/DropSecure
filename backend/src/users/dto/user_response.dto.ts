import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../generated/prisma';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User first name' })
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  lastName: string;

  @ApiProperty({ description: 'User email address' })
  email: string;

  @ApiProperty({ description: 'User role', enum: UserRole })
  role: UserRole;

  @ApiPropertyOptional({ description: 'User phone number' })
  phone?: string;

  @ApiPropertyOptional({ description: 'User address' })
  address?: string;

  @ApiPropertyOptional({ description: 'User city' })
  city?: string;

  @ApiPropertyOptional({ description: 'User state' })
  state?: string;

  @ApiPropertyOptional({ description: 'User zip code' })
  zipCode?: string;

  @ApiPropertyOptional({ description: 'User country' })
  country?: string;

  @ApiPropertyOptional({ description: 'User date of birth' })
  dateOfBirth?: Date;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Account verification status' })
  isVerified: boolean;

  @ApiProperty({ description: 'Account active status' })
  isActive: boolean;
}

export class UserProfileDto extends UserResponseDto {
  @ApiPropertyOptional({ description: 'Profile picture URL' })
  profilePicture?: string;

  @ApiPropertyOptional({ description: 'User bio' })
  bio?: string;

  @ApiPropertyOptional({ description: 'Last login date' })
  lastLoginAt?: Date;
}

export class CourierProfileDto {
  @ApiProperty({ description: 'Vehicle type' })
  vehicleType: string;

  @ApiProperty({ description: 'Vehicle registration number' })
  vehicleRegistration: string;

  @ApiProperty({ description: 'Driver license number' })
  licenseNumber: string;

  @ApiPropertyOptional({ description: 'Vehicle make and model' })
  vehicleDetails?: string;

  @ApiProperty({ description: 'Courier verification status' })
  isVerified: boolean;

  @ApiProperty({ description: 'Courier availability status' })
  status: string;

  @ApiPropertyOptional({ description: 'Current location latitude' })
  currentLat?: number;

  @ApiPropertyOptional({ description: 'Current location longitude' })
  currentLng?: number;

  @ApiPropertyOptional({ description: 'Delivery rating' })
  rating?: number;

  @ApiPropertyOptional({ description: 'Total completed deliveries' })
  completedDeliveries?: number;
}

export class CreateCourierProfileDto {
  @ApiProperty({ description: 'Vehicle type' })
  @IsString()
  @IsNotEmpty()
  vehicleType: string;

  @ApiProperty({ description: 'Vehicle registration number' })
  @IsString()
  @IsNotEmpty()
  vehicleRegistration: string;

  @ApiProperty({ description: 'Driver license number' })
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @ApiPropertyOptional({ description: 'Vehicle make and model' })
  @IsOptional()
  @IsString()
  vehicleDetails?: string;
}
