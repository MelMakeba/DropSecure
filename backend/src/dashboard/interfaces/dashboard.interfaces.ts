export interface PackageStatusCount {
  status: string;
  _count: { _all: number };
}

export interface RevenueMetrics {
  totalRevenue: number;
  avgPackageValue: number;
}

export interface CourierPerformance {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  courierPackages: { id: string; status: string }[];
}

export interface PackageStatusHistory {
  status: string;
  changedAt: Date;
  notes: string | null;
}

export interface PackageMetrics {
  id: string;
  receiverAddress: string;
  receiverCity: string;
  createdAt: Date;
  updatedAt: Date;
  packageStatusHistory: PackageStatusHistory[];
}

export interface UserStats {
  total: number;
  byRole: { role: string; _count: { _all: number } }[];
  active: number;
}

export interface ReportResult {
  data: any[]; // You can further type this if you want
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminDashboardStats {
  totalPackages: number;
  activeDeliveries: number;
  totalUsers: number;
  totalCouriers: number;
  availableCouriers: number;
  todayRevenue: number;
  weeklyPackages: {
    labels: string[];
    data: number[];
  };
  recentPackages: any[];
  courierPerformance: any[];
}

export interface SenderDashboardStats {
  totalPackagesSent: number;
  totalSpent: number;
  averageDeliveryTime: number; // in hours
  deliveredPackages: number;
  inTransitPackages: number;
  failedDeliveries: number;
  recentPackages: any[];
  monthlySpending: {
    labels: string[];
    data: number[];
  };
  deliverySuccessRate: number;
  averagePackageValue: number;
  topDestinations: {
    city: string;
    count: number;
  }[];
}

export interface CourierDashboardStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  activeDeliveries: number;
  averageRating: number;
  totalEarnings: number;
  todayDeliveries: number;
  averageDeliveryTime: number; // in hours
  deliverySuccessRate: number;
  recentDeliveries: any[];
  weeklyEarnings: {
    labels: string[];
    data: number[];
  };
  performanceMetrics: {
    onTimeDeliveries: number;
    customerRatings: number;
    totalDistance: number; // in km
  };
}
