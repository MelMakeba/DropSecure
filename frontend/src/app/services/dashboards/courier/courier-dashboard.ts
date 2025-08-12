import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Package } from '../../../models/package.model';
import { AuthService } from '../../auth/auth'; // Adjust import path

export interface CourierDashboardStats {
  assignedPackages: number;
  completedDeliveries: number;
  pendingPickups: number;
  totalEarnings: number;
  currentAssignments: Package[];
  deliverySuccessRate: number;
  averageDeliveryTime: number;
  monthlyEarnings: { month: string; earnings: number }[];
}

export interface LocationUpdate {
  packageId: string;
  latitude: number;
  longitude: number;
  address?: string;
  timestamp?: string;
}

export interface DeliveryAttempt {
  packageId: string;
  attemptDate: string;
  status: 'SUCCESS' | 'FAILED';
  notes?: string;
  signature?: string;
  recipientName?: string;
}

export interface CourierProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleType?: string;
  licenseNumber?: string;
  isActive: boolean;
  rating?: number;
  totalDeliveries: number;
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
export class CourierDashboard {
  private apiUrl = 'https://dropsecure.onrender.com';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Get courier dashboard statistics
   */
  getCourierDashboardStats(): Observable<CourierDashboardStats> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<CourierDashboardStats>>(
      `${this.apiUrl}/dashboard/courier/stats`,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // ===== PACKAGE ASSIGNMENTS =====

  /**
   * Get current assignments for courier
   */
  getCurrentAssignments(): Observable<Package[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<Package[]>>(
      `${this.apiUrl}/packages/courier/assignments`,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Get courier packages with pagination and filtering
   */
  getCourierPackages(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Observable<PaginatedResponse<Package>> {
    const headers = this.getAuthHeaders();
    let queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);
    }

    const url = queryParams.toString() 
      ? `${this.apiUrl}/packages/get-user-packages?${queryParams.toString()}`
      : `${this.apiUrl}/packages/get-user-packages`;

    return this.http.get<ApiResponse<PaginatedResponse<Package>>>(url, { headers }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Get package details by ID
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

  // ===== PACKAGE STATUS UPDATES =====

  /**
   * Mark package as picked up
   */
  markAsPickedUp(packageId: string, notes?: string): Observable<Package> {
    const headers = this.getAuthHeaders();
    
    return this.http.put<ApiResponse<Package>>(
      `${this.apiUrl}/packages/${packageId}/pickup`,
      { notes },
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
   * Mark package as delivered
   */
  markAsDelivered(packageId: string, deliveryData: {
    notes?: string;
    signature?: string;
    recipientName?: string;
    latitude?: number;
    longitude?: number;
    location?: string;
  }): Observable<Package> {
    const headers = this.getAuthHeaders();
    
    return this.http.put<ApiResponse<Package>>(
      `${this.apiUrl}/packages/${packageId}/status`,
      {
        status: 'DELIVERED',
        ...deliveryData
      },
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Report failed delivery
   */
  reportFailedDelivery(packageId: string, failureData: {
    reason: string;
    notes?: string;
    attemptDate?: string;
    latitude?: number;
    longitude?: number;
    location?: string;
  }): Observable<Package> {
    const headers = this.getAuthHeaders();
    
    return this.http.put<ApiResponse<Package>>(
      `${this.apiUrl}/packages/${packageId}/status`,
      {
        status: 'FAILED_DELIVERY',
        notes: failureData.notes || failureData.reason,
        latitude: failureData.latitude,
        longitude: failureData.longitude,
        location: failureData.location
      },
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // ===== LOCATION TRACKING =====

  /**
   * Update package location
   */
  updatePackageLocation(packageId: string, locationData: LocationUpdate): Observable<void> {
    const headers = this.getAuthHeaders();
    
    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/packages/${packageId}/location`,
      locationData,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Get package location history
   */
  getPackageLocationHistory(packageId: string): Observable<LocationUpdate[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<LocationUpdate[]>>(
      `${this.apiUrl}/packages/${packageId}/location-history`,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // ===== DELIVERY MANAGEMENT =====

  /**
   * Get pending pickups
   */
  getPendingPickups(): Observable<Package[]> {
    return this.getCourierPackages({ status: 'COURIER_ASSIGNED', limit: 100 }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get packages in transit
   */
  getPackagesInTransit(): Observable<Package[]> {
    return this.getCourierPackages({ 
      status: 'PICKED_UP,IN_TRANSIT,OUT_FOR_DELIVERY', 
      limit: 100 
    }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get delivery history
   */
  getDeliveryHistory(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Observable<PaginatedResponse<Package>> {
    const queryParams = {
      ...params,
      status: 'DELIVERED'
    };
    
    return this.getCourierPackages(queryParams);
  }

  /**
   * Get failed deliveries
   */
  getFailedDeliveries(): Observable<Package[]> {
    return this.getCourierPackages({ status: 'FAILED_DELIVERY', limit: 100 }).pipe(
      map(response => response.data)
    );
  }

  // ===== COURIER PROFILE =====

  /**
   * Get courier profile
   */
  getCourierProfile(): Observable<CourierProfile> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<CourierProfile>>(
      `${this.apiUrl}/courier/profile`,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Update courier profile
   */
  updateCourierProfile(profileData: Partial<CourierProfile>): Observable<CourierProfile> {
    const headers = this.getAuthHeaders();
    
    return this.http.put<ApiResponse<CourierProfile>>(
      `${this.apiUrl}/courier/profile`,
      profileData,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Update courier availability
   */
  updateAvailability(isAvailable: boolean): Observable<{ message: string }> {
    const headers = this.getAuthHeaders();
    
    return this.http.put<ApiResponse<{ message: string }>>(
      `${this.apiUrl}/courier/availability`,
      { isAvailable },
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // ===== EARNINGS & ANALYTICS =====

  /**
   * Get earnings summary
   */
  getEarningsSummary(): Observable<{
    totalEarnings: number;
    monthlyEarnings: { month: string; earnings: number }[];
    averagePerDelivery: number;
    completedDeliveries: number;
  }> {
    return this.getCourierDashboardStats().pipe(
      map(stats => ({
        totalEarnings: stats.totalEarnings,
        monthlyEarnings: stats.monthlyEarnings,
        averagePerDelivery: stats.completedDeliveries > 0 
          ? stats.totalEarnings / stats.completedDeliveries 
          : 0,
        completedDeliveries: stats.completedDeliveries
      }))
    );
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Observable<{
    successRate: number;
    averageDeliveryTime: number;
    totalAssignments: number;
    onTimeDeliveries: number;
    rating: number;
  }> {
    return this.getCourierDashboardStats().pipe(
      map(stats => ({
        successRate: stats.deliverySuccessRate,
        averageDeliveryTime: stats.averageDeliveryTime,
        totalAssignments: stats.assignedPackages + stats.completedDeliveries,
        onTimeDeliveries: Math.round(stats.completedDeliveries * (stats.deliverySuccessRate / 100)),
        rating: 4.5 // This would come from a separate rating system
      }))
    );
  }

  // ===== UTILITY METHODS =====

  /**
   * Get dashboard summary for quick overview
   */
  getDashboardSummary(): Observable<{
    todayPickups: number;
    todayDeliveries: number;
    pendingDeliveries: number;
    todayEarnings: number;
  }> {
    return this.getCourierDashboardStats().pipe(
      map(stats => ({
        todayPickups: 0, // Would need additional endpoint for today's data
        todayDeliveries: 0, // Would need additional endpoint for today's data
        pendingDeliveries: stats.assignedPackages,
        todayEarnings: 0 // Would need additional endpoint for today's earnings
      }))
    );
  }

  /**
   * Search packages
   */
  searchPackages(searchTerm: string, page: number = 1, limit: number = 10): Observable<PaginatedResponse<Package>> {
    return this.getCourierPackages({ 
      search: searchTerm, 
      page, 
      limit 
    });
  }

  /**
   * Get packages by status
   */
  getPackagesByStatus(status: string, page: number = 1, limit: number = 10): Observable<PaginatedResponse<Package>> {
    return this.getCourierPackages({ 
      status, 
      page, 
      limit 
    });
  }

  /**
   * Get route optimization suggestions
   */
  getRouteOptimization(packageIds: string[]): Observable<{
    optimizedRoute: Package[];
    totalDistance: number;
    estimatedTime: number;
  }> {
    const headers = this.getAuthHeaders();
    
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/courier/optimize-route`,
      { packageIds },
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Get nearby packages for pickup
   */
  getNearbyPackages(latitude: number, longitude: number, radius: number = 10): Observable<Package[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<Package[]>>(
      `${this.apiUrl}/packages/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // Private helper methods
  private getAuthHeaders(): HttpHeaders {
    const userStr = localStorage.getItem('dropsecure_user');
    const user = userStr ? JSON.parse(userStr) : null;
    let token = user?.accessToken;

    if (!token) {
      token = localStorage.getItem('token');
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('CourierDashboardService Error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
