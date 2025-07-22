import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Package } from '../../models/package.model';

export interface StatusEvent {
  id: string;
  packageId: string;
  status: string;
  location: string;
  timestamp: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Packages {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getPackages(): Observable<Package[]> {
    return this.http.get<Package[]>(`${this.apiUrl}/packages`);
  }

  getSentPackages(senderId: string): Observable<Package[]> {
    return this.http.get<Package[]>(`${this.apiUrl}/packages?senderId=${senderId}`);
  }

  getReceivedPackages(receiverId: string): Observable<Package[]> {
    return this.http.get<Package[]>(`${this.apiUrl}/packages?receiverId=${receiverId}`);
  }
  
  getStatusHistory(packageId: string): Observable<StatusEvent[]> {
    return this.http.get<{ [key: string]: StatusEvent[] }>(`${this.apiUrl}/statusHistory`)
      .pipe(
        map(historyObj => historyObj[packageId] || [])
      );
  }

  getPackageByTrackingNumber(trackingNumber: string): Observable<Package | undefined> {
    return this.http.get<Package[]>(`${this.apiUrl}/packages?trackingNumber=${trackingNumber}`)
      .pipe(
        map(pkgs => pkgs[0]) // Return the first match or undefined
      );
  }

  getAssignmentsForCourier(courierId: string): Observable<Package[]> {
    return this.http.get<Package[]>(`${this.apiUrl}/packages?courierId=${courierId}`);
  }

  // Edit the status of a package
  updatePackageStatus(packageId: string, status: string): Observable<Package> {
    return this.http.patch<Package>(`${this.apiUrl}/packages/${packageId}`, { status });
  }

  // Assign a package to a courier
  assignPackageToCourier(packageId: string, courierId: string, courierName: string): Observable<Package> {
    return this.http.patch<Package>(`${this.apiUrl}/packages/${packageId}`, { courierId, courierName });
  }

  // Create a new package
  createPackage(pkg: Package): Observable<Package> {
    return this.http.post<Package>(`${this.apiUrl}/packages`, pkg);
  }

  // Edit a package (full update)
  editPackage(packageId: string, pkg: Partial<Package>): Observable<Package> {
    return this.http.patch<Package>(`${this.apiUrl}/packages/${packageId}`, pkg);
  }

  // Delete a package
  deletePackage(packageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/packages/${packageId}`);
  }

  getCouriers(): Observable<{ id: string; name: string }[]> {
    return this.http.get<{ id: string; name: string }[]>(`${this.apiUrl}/couriers`);
  }
}
