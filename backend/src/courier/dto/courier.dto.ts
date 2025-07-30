import { CourierStatus } from 'generated/prisma';

export interface UpdateCourierStatusRequest {
  status: CourierStatus;
  currentLat?: number;
  currentLng?: number;
  packageId?: string;
}

export interface UpdateLocationRequest {
  currentLat: number;
  currentLng: number;
  packageId: string;
}
