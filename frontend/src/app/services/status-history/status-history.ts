import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StatusEvent } from '../../models/status-event.model';

@Injectable({
  providedIn: 'root'
})
export class StatusHistory {
  private apiUrl = 'https://dropsecure.onrender.com';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('dropsecure_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getStatusHistory(packageId: string): Observable<StatusEvent[]> {
    return this.http.get<StatusEvent[]>(`${this.apiUrl}/packages/${packageId}/status-history`, {
      headers: this.getAuthHeaders()
    });
  }

  changeStatus(
    packageId: string,
    status: string,
    user: { id: string; role: string; name: string },
    location?: string,
    notes?: string
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/packages/${packageId}/status`, {
      status,
      location,
      notes
    }, {
      headers: this.getAuthHeaders()
    });
  }
}
