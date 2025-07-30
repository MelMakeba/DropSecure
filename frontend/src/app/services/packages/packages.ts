import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Package } from '../../models/package.model';

@Injectable({
  providedIn: 'root'
})
export class Packages {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // Utility to get token
  private getAuthHeaders(): { headers: HttpHeaders } {
    const userStr = localStorage.getItem('dropsecure_user');
    const user = userStr ? JSON.parse(userStr) : null;
    let token = user?.accessToken;

    if (!token) {
      token = localStorage.getItem('token');
    }

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  // Get all packages (admin only)
  getPackages(): Observable<Package[]> {
    return this.http.get<any>(`${this.apiUrl}/packages`, this.getAuthHeaders())
      .pipe(
        map(res => res.data as Package[])
      );
  }

  // Get packages for the current user (all roles)
  getUserPackages(): Observable<Package[]> {
    return this.http.get<Package[]>(`${this.apiUrl}/packages/get-user-packages`, this.getAuthHeaders());
  }

  // Get package by ID
  getPackageById(packageId: string): Observable<Package> {
    return this.http.get<Package>(`${this.apiUrl}/packages/${packageId}`, this.getAuthHeaders());
  }

  // Get package by tracking number (public)
  getPackageByTrackingNumber(trackingNumber: string): Observable<Package> {
    return this.http.get<Package>(`${this.apiUrl}/packages/track/${trackingNumber}`, this.getAuthHeaders());
  }

  // Create a new package (admin only)
  createPackage(pkg: Partial<Package>): Observable<Package> {
    return this.http.post<Package>(`${this.apiUrl}/packages/create`, pkg, this.getAuthHeaders());
  }
  // Edit an existing package (admin only)
  editPackage(packageId: string, pkg: Partial<Package>): Observable<Package> {
    return this.http.put<Package>(`${this.apiUrl}/packages/update/${packageId}`, pkg, this.getAuthHeaders());
  }
  // Update package status (admin/courier)
  updatePackageStatus(packageId: string, status: string, notes?: string): Observable<Package> {
    return this.http.put<Package>(`${this.apiUrl}/packages/${packageId}/status`, { status, notes });
  }

  // Assign courier to package (admin only)
  assignPackageToCourier(packageId: string, courierId: string): Observable<Package> {
    return this.http.put<Package>(`${this.apiUrl}/packages/${packageId}/assign-courier`, { courierId });
  }

  // Update package location (courier only)
  updatePackageLocation(packageId: string, location: { latitude: number; longitude: number; address: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/packages/${packageId}/location`, location);
  }

  // Get package location (sender only)
  getPackageLocation(packageId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/packages/${packageId}/location`);
  }

  // Create delivery attempt (courier only)
  createDeliveryAttempt(packageId: string, status: string, notes?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/packages/${packageId}/delivery-attempt`, { status, notes });
  }

  // Delete a package (admin only)
  deletePackage(packageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/packages/${packageId}`);
  }

  // Get all couriers (admin only)
  getCouriers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/courier/admin/couriers`);
  }

  // Get available couriers (admin only)
  getAvailableCouriers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/courier/admin/couriers/available`);
  }

  // Verify courier (admin only)
  verifyCourier(courierId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/courier/admin/courier/${courierId}/verify`, {});
  }

  // Update courier status (admin only)
  updateCourierStatus(courierId: string, status: string, currentLat?: number, currentLng?: number, packageId?: string): Observable<any> {
    const body: any = { status, currentLat, currentLng };
    if (packageId) body.packageId = packageId;
    return this.http.put(`${this.apiUrl}/courier/admin/courier/${courierId}/status`, body);
  }

  // Update courier location (courier only)
  updateCourierLocation(courierId: string, packageId: string, latitude: number, longitude: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/location/update`, {
      courierId,
      packageId,
      latitude,
      longitude
    });
  }

  // Get package location history
  getPackageLocationHistory(packageId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/location/package/${packageId}`);
  }

  // Get current courier location
  getCourierCurrentLocation(courierId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/location/courier/${courierId}/current`);
  }

}
