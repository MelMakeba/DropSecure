import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { Package } from '../../models/package.model'

@Injectable({
  providedIn: 'root'
})
export class StatusHistory {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  changeStatus(
    packageId: string,
    newStatus: string,
    updater: { id: string; role: 'admin'| 'courier'; name: string},
    location?: string,
    notes?: string
  ): Observable<Package> {
    return this.http.patch<Package> (`${this.apiUrl}/packages/${packageId}`,{
      status: newStatus,
      updatedAt: new Date().toISOString()
    }).pipe(

     switchMap(pkg =>
      this.http.post(`${this.apiUrl}/status-history/${packageId}`, {
        id: 'hist_' + Date.now(),
          packageId,
          status: newStatus,
          location: location || '',
          timestamp: new Date().toISOString(),
          notes: notes || `Status changed by ${updater.role} (${updater.name})`
      }).pipe (
        switchMap(()=> [pkg])
      )
      )
     );
  }
}
