import { Sender } from './../sender/sender';
export interface Package {
  id: string;
  trackingId?: string;
  trackingNumber?: string;

  senderId: string;
  senderName: string; 
  senderPhone?: string;
  senderAddress?: string;
  senderEmail?: string;
  receiverEmail?: string;
  receiverId?: string;
  receiverName: string; 
  receiverPhone?: string;
  receiverAddress?: string;
  courierId?: string;
  courierName?: string;

  createdById: string;

  weight?: number;
  description: string;
  specialInstructions?: string;
  value?: number;

  preferredPickupDate?: string; 
  preferredDeliveryDate?: string;
  actualPickupDate?: string;
  actualDeliveryDate?: string;
  estimatedDelivery?: string; // or Date if you prefer

  status: string; 

  estimatedCost?: number;
  actualCost?: number;
  isPaid: boolean;

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