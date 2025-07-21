export interface Package {
  id: string;
  trackingId: string;

  senderId: string;
  senderName?: string; 
  receiverId?: string;
  receiverName?: string; 
  receiverEmail: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity: string;
  receiverState: string;
  receiverZipCode: string;
  receiverCountry: string;

  createdById: string;

  weight: number;
  description: string;
  specialInstructions?: string;
  value?: number;

  preferredPickupDate?: string; 
  preferredDeliveryDate?: string;
  actualPickupDate?: string;
  actualDeliveryDate?: string;

  status: string; 
  courierId?: string;

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