import {
  PackageStatus,
  CourierStatus,
  DeliveryAttemptStatus,
} from '../../../generated/prisma';
import { User } from '../../auth/interfaces/user.interface';

export interface CourierProfileData extends User {
  licenseNumber?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  currentLat?: number;
  currentLng?: number;
  lastLocationUpdate?: Date;
  rating?: number;
  totalDeliveries: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourierStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  rating: number;
  totalEarnings?: number;
}

export interface CourierProfileWithStats extends CourierProfileData {
  stats: CourierStats;
}

export interface AssignPackageRequest {
  packageId: string;
  courierId: string;
  changedBy: string;
}

export interface UpdateCourierStatusRequest {
  status: CourierStatus;
  currentLat?: number;
  currentLng?: number;
  packageId?: string; // Optional, if updating status for a specific package
}

export interface UpdateLocationRequest {
  packageId: string;
  currentLat: number;
  currentLng: number;
}

export interface DeliveryAttemptRequest {
  packageId: string;
  status: DeliveryAttemptStatus;
  notes?: string;
  proofOfDelivery?: string;
  recipientName?: string;
  deliveryLocation?: {
    lat: number;
    lng: number;
  };
}

export interface PackageWithDetails {
  id: string;
  trackingNumber: string;
  status: PackageStatus;
  senderName: string;
  senderAddress: string;
  recipientName: string;
  recipientAddress: string;
  recipientPhone?: string;
  weight?: number;
  dimensions?: string;
  value?: number;
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  courierNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
