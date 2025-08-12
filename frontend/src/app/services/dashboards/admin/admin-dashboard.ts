import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Package } from '../../../models/package.model';
import { AuthService } from '../../auth/auth'; // Adjust import path

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
  totalSenders?: number;
  activePackages?: number;
  totalRevenue?: number;
  packageStatusBreakdown?: { [key: string]: number };
  monthlyRevenue?: { month: string; revenue: number }[];
  topCouriers?: { id: string; name: string; deliveries: number }[];
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  senders: number;
  couriers: number;
  admins: number;
  recentUsers: User[];
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  phone?: string;
}

export interface CourierAssignment {
  packageId: string;
  courierId: string;
  courierName: string;
  packageDetails: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private apiUrl = 'https://dropsecure.onrender.com';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Get admin dashboard statistics
   */
  getAdminDashboardStats(): Observable<AdminDashboardStats> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<AdminDashboardStats>>(
      `${this.apiUrl}/dashboard/admin/stats`,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // ===== PACKAGE MANAGEMENT =====

  /**
   * Get all packages with pagination and filtering
   */
  getAllPackages(params?: any): Observable<any> {
    const headers = this.getAuthHeaders();
    let url = `${this.apiUrl}/packages`;
    
    if (params) {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }

    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        // Handle wrapped response format
        if (response && response.data) {
          return {
            data: response.data,
            total: response.total || response.data.length,
            totalPages: response.totalPages || Math.ceil((response.total || response.data.length) / (params?.limit || 10)),
            currentPage: response.currentPage || params?.page || 1
          };
        }
        // Handle direct array response
        return {
          data: Array.isArray(response) ? response : [],
          total: Array.isArray(response) ? response.length : 0,
          totalPages: 1,
          currentPage: 1
        };
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Create package by admin
   */
  createPackage(packageData: any): Observable<Package> {
    const headers = this.getAuthHeaders();
    
    return this.http.post<ApiResponse<Package>>(
      `${this.apiUrl}/packages/create-by-admin`,
      packageData,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Get package by ID
   */
  getPackageById(packageId: string): Observable<Package> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<Package>>(
      `${this.apiUrl}/packages/${packageId}`,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Update package status
   */
  updatePackageStatus(packageId: string, statusData: {
    status: string;
    notes?: string;
    latitude?: number;
    longitude?: number;
    location?: string;
  }): Observable<Package> {
    const headers = this.getAuthHeaders();
    
    return this.http.put<ApiResponse<Package>>(
      `${this.apiUrl}/packages/${packageId}/status`,
      statusData,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Assign courier to package
   */
  assignCourierToPackage(packageId: string, courierId: string): Observable<Package> {
    const headers = this.getAuthHeaders();
    
    return this.http.put<ApiResponse<Package>>(
      `${this.apiUrl}/packages/${packageId}/assign-courier`,
      { courierId },
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Cancel package
   */
  cancelPackage(packageId: string): Observable<Package> {
    const headers = this.getAuthHeaders();
    
    return this.http.put<ApiResponse<Package>>(
      `${this.apiUrl}/packages/${packageId}/cancel`,
      {},
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Update package details
   */
  updatePackage(packageId: string, updateData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/packages/${packageId}`,
      updateData,
      { headers }
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get update history
   */
  getPackageUpdateHistory(packageId: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<ApiResponse<any[]>>(
      `${this.apiUrl}/packages/${packageId}/update-history`,
      { headers }
    ).pipe(
      map(response => response.data)
    );
  }

  // ===== USER MANAGEMENT =====

  /**
   * Get all users with pagination and filtering
   */
  getAllUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    isActive?: boolean;
  }): Observable<PaginatedResponse<User>> {
    const headers = this.getAuthHeaders();
    let queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.role) queryParams.append('role', params.role);
      if (params.search) queryParams.append('search', params.search);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    }

    const url = queryParams.toString() 
      ? `${this.apiUrl}/users?${queryParams.toString()}`
      : `${this.apiUrl}/users`;

    return this.http.get<ApiResponse<PaginatedResponse<User>>>(url, { headers }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): Observable<User> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<User>>(
      `${this.apiUrl}/users/${userId}`,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Create new user
   */
  createUser(userData: any): Observable<User> {
    const headers = this.getAuthHeaders();
    
    return this.http.post<ApiResponse<User>>(
      `${this.apiUrl}/users/create`,
      userData,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Update user
   */
  updateUser(userId: string, userData: any): Observable<User> {
    const headers = this.getAuthHeaders();
    
    return this.http.put<ApiResponse<User>>(
      `${this.apiUrl}/users/${userId}`,
      userData,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Delete user
   */
  deleteUser(userId: string): Observable<{ message: string }> {
    const headers = this.getAuthHeaders();
    
    return this.http.delete<ApiResponse<{ message: string }>>(
      `${this.apiUrl}/users/${userId}`,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Toggle user active status
   */
  toggleUserStatus(userId: string): Observable<User> {
    const headers = this.getAuthHeaders();
    
    return this.http.put<ApiResponse<User>>(
      `${this.apiUrl}/users/${userId}/toggle-status`,
      {},
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // ===== COURIER MANAGEMENT =====

  /**
   * Get all couriers
   */
  getAllCouriers(): Observable<User[]> {
    return this.getAllUsers({ role: 'COURIER', limit: 1000 }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get courier assignments
   */
  getCourierAssignments(courierId: string): Observable<Package[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<Package[]>>(
      `${this.apiUrl}/packages/courier/${courierId}/assignments`,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // ===== CONTACT MANAGEMENT =====

  /**
   * Get all contact submissions
   */
  getContactSubmissions(params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    search?: string;
  }): Observable<PaginatedResponse<any>> {
    const headers = this.getAuthHeaders();
    let queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());
      if (params.search) queryParams.append('search', params.search);
    }

    const url = queryParams.toString() 
      ? `${this.apiUrl}/contact?${queryParams.toString()}`
      : `${this.apiUrl}/contact`;

    return this.http.get<ApiResponse<PaginatedResponse<any>>>(url, { headers }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Get contact statistics
   */
  getContactStats(): Observable<any> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/contact/stats`,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Mark contact as read
   */
  markContactAsRead(contactId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/contact/${contactId}/mark-read`,
      {},
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Delete contact submission
   */
  deleteContactSubmission(contactId: string): Observable<{ message: string }> {
    const headers = this.getAuthHeaders();
    
    return this.http.delete<ApiResponse<{ message: string }>>(
      `${this.apiUrl}/contact/${contactId}`,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // ===== ANALYTICS & REPORTS =====

  /**
   * Get package analytics
   */
  getPackageAnalytics(dateRange?: { startDate: string; endDate: string }): Observable<any> {
    return this.getAdminDashboardStats().pipe(
      map(stats => ({
        statusBreakdown: stats.packageStatusBreakdown,
        monthlyRevenue: stats.monthlyRevenue,
        totalRevenue: stats.totalRevenue,
        totalPackages: stats.totalPackages,
      }))
    );
  }

  /**
   * Get top performing couriers
   */
  // getTopCouriers(limit: number = 10): Observable<{ id: string; name: string; deliveries: number }[]> {
  //   return this.getAdminDashboardStats().pipe(
  //     map(stats => stats.topCouriers.slice(0, limit))
  //   );
  // }

  /**
   * Calculate package cost
   */
  calculatePackageCost(weight: number, distance: number, priority: string = 'STANDARD'): Observable<{ cost: number }> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<{ cost: number }>>(
      `${this.apiUrl}/packages/calculate-cost/${weight}/${distance}?priority=${priority}`,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // ===== UTILITY METHODS =====

  /**
   * Get dashboard summary for quick overview
   */
  getDashboardSummary(): Observable<{
    packages: { total: number; active: number; delivered: number };
    users: { total: number; couriers: number; senders: number };
    revenue: { total: number; monthly: { month: string; revenue: number; }[] };
  }> {
    return this.getAdminDashboardStats().pipe(
      map(stats => ({
        packages: {
          total: stats.totalPackages || 0,
          active: stats.activePackages || 0,
          delivered: (stats.totalPackages || 0) - (stats.activeDeliveries || 0)
        },
        users: {
          total: stats.totalUsers || 0,
          couriers: stats.totalCouriers || 0,
          senders: stats.totalSenders || 0
        },
        revenue: {
          total: stats.totalRevenue || 0,
          monthly: stats.monthlyRevenue || []
        }
      }))
    );
  }

  /**
   * Search across all entities
   */
  globalSearch(searchTerm: string): Observable<{
    packages: Package[];
    users: User[];
    total: number;
  }> {
    const packagesSearch = this.getAllPackages({ search: searchTerm, limit: 5 });
    const usersSearch = this.getAllUsers({ search: searchTerm, limit: 5 });

    return packagesSearch.pipe(
      map(packageResults => ({
        packages: packageResults.data,
        users: [], // Will be populated when usersSearch completes
        total: packageResults.total
      })),
      catchError(this.handleError)
    );
  }

  // Private helper methods
  private getAuthHeaders(): HttpHeaders {
    const userStr = localStorage.getItem('dropsecure_user');
    let token = '';
    
    if (userStr) {
      const user = JSON.parse(userStr);
      token = user.accessToken || user.token;
    }
    
    if (!token) {
      token = localStorage.getItem('token') || '';
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('AdminDashboardService Error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
