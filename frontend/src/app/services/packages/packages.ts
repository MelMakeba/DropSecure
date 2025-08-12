import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Package } from '../../models/package.model';

@Injectable({
  providedIn: 'root'
})
export class Packages {
  private apiUrl = 'https://dropsecure.onrender.com/packages';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('dropsecure_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getUserPackages(): Observable<Package[]> {
    return this.http.get<Package[]>(`${this.apiUrl}/get-user-packages`, {
      headers: this.getAuthHeaders()
    });
  }

  getPackageByTrackingNumber(trackingId: string): Observable<Package> {
    return this.http.get<Package>(`${this.apiUrl}/track/${trackingId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getAssignmentsForCourier(courierId: string): Observable<Package[]> {
    return this.http.get<Package[]>(`${this.apiUrl}/courier/${courierId}/assignments`, {
      headers: this.getAuthHeaders()
    });
  }
}
