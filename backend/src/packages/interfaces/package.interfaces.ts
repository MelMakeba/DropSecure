import { PackageStatus, UserRole } from '../../../generated/prisma';

export interface PackageInterface {
  id: string;
  trackingId: string;

  // Sender information
  senderId: string;
  senderEmail: string;

  // Receiver information
  receiverId?: string | null;
  receiverName: string;
  receiverEmail: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity: string;
  receiverState: string;
  receiverZipCode: string;
  receiverCountry: string;

  // Created by (Admin)
  createdById: string;

  // Package details
  weight: number;
  description: string;
  specialInstructions?: string | null;
  value?: number | null;
  price: number; // Required field

  // Delivery information
  preferredPickupDate?: Date | null;
  preferredDeliveryDate?: Date | null;
  actualPickupDate?: Date | null;
  actualDeliveryDate?: Date | null;

  // Status and assignment
  status: PackageStatus;
  courierId?: string | null;

  // Pricing
  estimatedCost?: number | null;
  actualCost?: number | null;
  isPaid: boolean;

  // Tracking
  currentLat?: number | null;
  currentLng?: number | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface PackageWithRelations extends PackageInterface {
  sender: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  receiver?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  } | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  courier?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
  statusHistory: PackageStatusHistoryInterface[];
  locationUpdates: LocationUpdateInterface[];
  deliveryAttempts: DeliveryAttemptInterface[];
}

export interface PackageStatusHistoryInterface {
  id: string;
  packageId: string;
  status: PackageStatus;
  changedBy: string;
  changedAt: Date;
  notes?: string | null;
  location?: string | null;
}

export interface LocationUpdateInterface {
  id: string;
  packageId: string;
  currentLocation: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  timestamp: Date;
}

export interface DeliveryAttemptInterface {
  id: string;
  packageId: string;
  attemptNumber: number;
  attemptDate: Date;
  result: string;
  notes?: string | null;
  nextAttemptDate?: Date | null;
  courierId: string;
}
