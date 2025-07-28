/* eslint-disable @typescript-eslint/no-unsafe-argument */
// src/packages/dto/package.dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEmail,
  IsDateString,
  IsEnum,
  Min,
  Max,
  Length,
  IsPositive,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PackageStatus } from '../../../generated/prisma';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePackageDto {
  @ApiProperty({ description: 'Sender user ID' })
  @IsString()
  senderId: string;

  @ApiProperty({ description: 'Sender email address' })
  @IsEmail()
  senderEmail: string;

  @ApiPropertyOptional({ description: 'Receiver user ID (if registered user)' })
  @IsOptional()
  @IsString()
  receiverId?: string;

  @ApiProperty({
    description: 'Receiver full name',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @Length(2, 100)
  receiverName: string;

  @ApiProperty({ description: 'Receiver email address' })
  @IsEmail()
  receiverEmail: string;

  @ApiProperty({ description: 'Receiver phone number' })
  @IsString()
  @Length(10, 15)
  receiverPhone: string;

  @ApiProperty({
    description: 'Receiver street address',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @Length(5, 200)
  receiverAddress: string;

  @ApiProperty({ description: 'Receiver city', minLength: 2, maxLength: 50 })
  @IsString()
  @Length(2, 50)
  receiverCity: string;

  @ApiProperty({
    description: 'Receiver state/province',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @Length(2, 50)
  receiverState: string;

  @ApiProperty({
    description: 'Receiver ZIP/postal code',
    minLength: 3,
    maxLength: 10,
  })
  @IsString()
  @Length(3, 10)
  receiverZipCode: string;

  @ApiProperty({ description: 'Receiver country', minLength: 2, maxLength: 50 })
  @IsString()
  @Length(2, 50)
  receiverCountry: string;

  @ApiProperty({
    description: 'Package weight in kg',
    minimum: 0.1,
    maximum: 50,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(50)
  @Transform(({ value }) => parseFloat(value))
  weight: number;

  @ApiProperty({
    description: 'Package description',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @Length(10, 500)
  description: string;

  @ApiPropertyOptional({
    description: 'Special handling instructions',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  specialInstructions?: string;

  @ApiPropertyOptional({
    description: 'Declared value of package contents',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  value?: number;

  @ApiProperty({ description: 'Package delivery price', minimum: 1 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  price: number;

  @ApiPropertyOptional({ description: 'Preferred pickup date (ISO string)' })
  @IsOptional()
  @IsDateString()
  preferredPickupDate?: string;

  @ApiPropertyOptional({ description: 'Preferred delivery date (ISO string)' })
  @IsOptional()
  @IsDateString()
  preferredDeliveryDate?: string;

  @ApiPropertyOptional({ description: 'Courier ID for assignment' })
  @IsOptional()
  @IsString()
  courierId?: string;
}

export class UpdatePackageStatusDto {
  @ApiProperty({
    description: 'New package status',
    enum: PackageStatus,
    enumName: 'PackageStatus',
  })
  @IsEnum(PackageStatus)
  status: PackageStatus;

  @ApiPropertyOptional({
    description: 'Notes about the status change',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Location where status was updated',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  location?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-180)
  @Max(180)
  longitude?: number;
}

export class UpdatePackageLocationDto {
  @ApiProperty({ description: 'Latitude coordinate' })
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ description: 'Human-readable address' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  address?: string;
}

export class PackageQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by package status',
    enum: PackageStatus,
    enumName: 'PackageStatus',
  })
  @IsOptional()
  @IsEnum(PackageStatus)
  status?: PackageStatus;

  @ApiPropertyOptional({
    description: 'Search by tracking ID or receiver name',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by courier ID' })
  @IsOptional()
  @IsString()
  courierId?: string;

  @ApiPropertyOptional({
    description: 'Start date for date range filter (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for date range filter (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
