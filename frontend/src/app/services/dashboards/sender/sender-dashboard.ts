import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { Package } from '../../../models/package.model'; // Adjust the import path as necessary


@Injectable({ providedIn: 'root' })
export class SenderDashboardService {
  private apiUrl = 'https://dropsecure.onrender.com/packages';

  constructor(private http: HttpClient) {}

  getStats(senderId: string): Observable<{ total: number; delivered: number; inTransit: number; pending: number }> {
    if (!senderId) {
      return of({ total: 0, delivered: 0, inTransit: 0, pending: 0 });
    }
    return this.http.get<Package[]>(this.apiUrl).pipe(
      map(allPackages => {
        const senderPackages = allPackages.filter(pkg => pkg.senderId === senderId);
        return {
          total: senderPackages.length,
          delivered: senderPackages.filter(pkg => pkg.status === 'delivered').length,
          inTransit: senderPackages.filter(pkg => pkg.status === 'in_transit').length,
          pending: senderPackages.filter(pkg => pkg.status === 'pending').length,
        };
      })
    );
  }
}
