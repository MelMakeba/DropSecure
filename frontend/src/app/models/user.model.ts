export type UserRole = 'ADMIN' | 'SENDER' | 'COURIER';

export interface User {
  id: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  isEmailVerified: boolean;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
}

export interface Admin extends User {
  role: 'ADMIN';
}

export interface Customer extends User {
  role: 'SENDER';
  phone: string;
  address: string;
  totalPackagesSent: number;
  totalPackagesReceived: number;
}

export interface Courier extends User {
  role: 'COURIER';
  vehicleType?: string;
  licenseNumber?: string;
  zone?: string;
  isAvailable: boolean;
  rating: number;
  totalDeliveries: number;
}

export interface AnyUser {
  id: string;
  password: string;
  email: string;
  role: UserRole;
  phone:string;
  firstName: string;
  lastName: string;
  createdAt: string;
  isActive: boolean;
  address?: string;
  vehicleType?: string;
  licenseNumber?: string;
  zone?: string;
}