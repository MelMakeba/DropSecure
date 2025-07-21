export type UserRole = 'admin' | 'customer' | 'courier';

export interface User {
  id: string;
  password: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
}

export interface Admin extends User {
  role: 'admin';
}

export interface Customer extends User {
  role: 'customer';
  address: string;
  totalPackagesSent: number;
  totalPackagesReceived: number;
}

export interface Courier extends User {
  role: 'courier';
  vehicleType?: string;
  licenseNumber?: string;
  zone?: string;
  isAvailable: boolean;
  rating: number;
  totalDeliveries: number;
}

export type AnyUser = Admin | Customer | Courier;