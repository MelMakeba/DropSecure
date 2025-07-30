import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { Package } from '../../models/package.model';
import { StatusEvent } from '../../models/status-event.model';

@Injectable({
  providedIn: 'root'
})
export class StatusHistory {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

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

  /**
   * Change the status of a package and log the status event.
   * @param packageId The package ID
   * @param newStatus The new status string (e.g. "DELIVERED")
   * @param updater   The user making the change
   * @param notes     Optional notes for the status event
   * @param location  Optional location string
   */
  changeStatus(
    packageId: string,
    newStatus: string,
    updater: { id: string; role: 'ADMIN' | 'COURIER'; name: string },
    notes?: string,
    location?: string
  ): Observable<Package> {
    // 1. Update package status
    return this.http.put<Package>(`${this.apiUrl}/packages/${packageId}/status`, {
      status: newStatus,
      notes: notes || `Status changed by ${updater.role} (${updater.name})`
    }, this.getAuthHeaders()).pipe(
      // 2. Log status event
      switchMap(pkg =>
        this.http.post(`${this.apiUrl}/status-history/${packageId}`, {
          id: 'hist_' + Date.now(),
          packageId,
          status: newStatus,
          location: location || '',
          timestamp: new Date().toISOString(),
          notes: notes || `Status changed by ${updater.role} (${updater.name})`,
          updatedBy: updater.name,
          updatedById: updater.id,
          updatedByRole: updater.role
        }, this.getAuthHeaders()).pipe(
          switchMap(() => [pkg])
        )
      )
    );
  }

  /**
   * Get the status history for a package.
   * @param packageId The package ID
   */
  getStatusHistory(packageId: string): Observable<StatusEvent[]> {
    return this.http.get<StatusEvent[]>(`${this.apiUrl}/status-history/${packageId}`, this.getAuthHeaders());
  }
}
