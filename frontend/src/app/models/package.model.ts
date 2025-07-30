import { Sender } from './../sender/sender';

export interface Package {
  id: string;
  trackingId?: string;

  senderId: string;
  senderEmail?: string;
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;

  // Nested sender object from backend
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };

  receiverId?: string;
  receiverName: string;
  receiverEmail?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  receiverCity?: string;
  receiverState?: string;
  receiverZipCode?: string;
  receiverCountry?: string;

  courierId?: string;
  courierName?: string;

  // Nested courier object from backend
  courier?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };

  createdById?: string;

  weight?: number;
  description: string;
  specialInstructions?: string;
  value?: number;
  price?: number;

  preferredPickupDate?: string;
  preferredDeliveryDate?: string;
  actualPickupDate?: string;
  actualDeliveryDate?: string;
  estimatedDelivery?: string;

  status: string;

  estimatedCost?: number;
  actualCost?: number;
  isPaid?: boolean;

  currentLat?: number;
  currentLng?: number;

  createdAt: string;
  updatedAt: string;
  sentAt?: string;

  statusHistory?: any[];
  locationUpdates?: any[];
  deliveryAttempts?: any[];
  notifications?: any[];
  reviews?: any[];
}