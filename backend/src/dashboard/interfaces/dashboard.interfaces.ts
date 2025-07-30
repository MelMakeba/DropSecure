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
