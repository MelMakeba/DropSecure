import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Package } from '../../../models/package.model';
import { AuthService } from '../../auth/auth'; // Adjust import path

export interface SenderDashboardStats {
  totalPackagesSent: number;
  packagesInTransit: number;
  packagesDelivered: number;
  totalSpent: number;
  recentPackages: Package[];
  packageStatusBreakdown: Record<string, number>;
  averageDeliveryTime: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

@Injectable({ providedIn: 'root' })
export class SenderDashboardService {
  private apiUrl = 'https://dropsecure.onrender.com/dashboard';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Get sender dashboard statistics
   */
  getSenderDashboardStats(): Observable<SenderDashboardStats> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<SenderDashboardStats>>(
      `${this.apiUrl}/sender/stats`,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Get sender packages with pagination and filtering
   */
  getSenderPackages(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Observable<{
    packages: Package[];
    total: number;
    page: number;
    limit: number;
  }> {
    const headers = this.getAuthHeaders();
    let queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);
    }

    const url = queryParams.toString() 
      ? `https://dropsecure.onrender.com/packages/get-user-packages?${queryParams.toString()}`
      : `https://dropsecure.onrender.com/packages/get-user-packages`;

    return this.http.get<ApiResponse<any>>(url, { headers }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Get received packages (where user is the receiver)
   */
  getReceivedPackages(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Observable<{
    packages: Package[];
    total: number;
    page: number;
    limit: number;
  }> {
    const headers = this.getAuthHeaders();
    let queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
    }

    const url = queryParams.toString() 
      ? `https://dropsecure.onrender.com/packages/received?${queryParams.toString()}`
      : `https://dropsecure.onrender.com/packages/received`;

    return this.http.get<ApiResponse<any>>(url, { headers }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Track package by tracking ID
   */
  trackPackage(trackingId: string): Observable<Package> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<Package>>(
      `https://dropsecure.onrender.com/packages/track/${trackingId}`,
      { headers }
    ).pipe(
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
      `https://dropsecure.onrender.com/packages/${packageId}`,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Cancel a package
   */
  cancelPackage(packageId: string): Observable<Package> {
    const headers = this.getAuthHeaders();
    
    return this.http.put<ApiResponse<Package>>(
      `https://dropsecure.onrender.com/packages/${packageId}/cancel`,
      {},
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Get dashboard summary for quick stats
   */
  getDashboardSummary(): Observable<{
    totalSent: number;
    inTransit: number;
    delivered: number;
    totalSpent: number;
  }> {
    return this.getSenderDashboardStats().pipe(
      map(stats => ({
        totalSent: stats.totalPackagesSent,
        inTransit: stats.packagesInTransit,
        delivered: stats.packagesDelivered,
        totalSpent: stats.totalSpent
      }))
    );
  }

  /**
   * Get package status breakdown for charts
   */
  getPackageStatusBreakdown(): Observable<{ status: string; count: number }[]> {
    return this.getSenderDashboardStats().pipe(
      map(stats => 
        Object.entries(stats.packageStatusBreakdown).map(([status, count]) => ({
          status,
          count
        }))
      )
    );
  }

  /**
   * Get recent packages for dashboard
   */
  getRecentPackages(limit: number = 5): Observable<Package[]> {
    return this.getSenderPackages({ page: 1, limit }).pipe(
      map(response => response.packages)
    );
  }

  /**
   * Search packages
   */
  searchPackages(searchTerm: string, page: number = 1, limit: number = 10): Observable<{
    packages: Package[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.getSenderPackages({ 
      search: searchTerm, 
      page, 
      limit 
    });
  }

  /**
   * Filter packages by status
   */
  getPackagesByStatus(status: string, page: number = 1, limit: number = 10): Observable<{
    packages: Package[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.getSenderPackages({ 
      status, 
      page, 
      limit 
    });
  }

  /**
   * Get stats for a specific sender
   */
  getStats(senderId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/sender/${senderId}`, { headers }).pipe(
      map(response => response.data || response),
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
    console.error('SenderDashboardService Error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
