import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { Admin, Customer, Courier } from '../../models/user.model';
import { Package } from '../../models/package.model';

@Injectable({
  providedIn: 'root'
})
export class Analysis {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getCounts(): Observable<{
    admins: number;
    customers: number;
    couriers: number;
    packages: number;
    activeDeliveries: number;
    availableCouriers: number;
    revenue: number;
  }> {
    return forkJoin({
      admins: this.http.get<Admin[]>(`${this.apiUrl}/admins`),
      customers: this.http.get<Customer[]>(`${this.apiUrl}/customers`),
      couriers: this.http.get<Courier[]>(`${this.apiUrl}/couriers`),
      packages: this.http.get<Package[]>(`${this.apiUrl}/packages`)
    }).pipe(
      map(({ admins, customers, couriers, packages }) => {
        const activeDeliveries = packages.filter(pkg =>
          pkg.status !== 'delivered' &&
          pkg.status !== 'cancelled' &&
          pkg.status !== 'returned'
        ).length;
        const availableCouriers = couriers.filter(c => c.isAvailable).length;
        const revenue = packages
          .filter(pkg => pkg.isPaid)
          .reduce((sum, pkg) => sum + (pkg.actualCost || 0), 0);

        return {
          admins: admins.length,
          customers: customers.length,
          couriers: couriers.length,
          packages: packages.length,
          activeDeliveries,
          availableCouriers,
          revenue
        };
      })
    );
  }
}
