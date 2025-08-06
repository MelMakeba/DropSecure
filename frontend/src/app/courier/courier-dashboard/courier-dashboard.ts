import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { IonicModule } from '@ionic/angular';
import { Packages} from '../../services/packages/packages'; // Adjust the import according to your project structure
import { Package } from '../../models/package.model'; // Adjust the import according to your project structure

@Component({
  selector: 'app-courier-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar, IonicModule],
  templateUrl: './courier-dashboard.html',
  styleUrls: ['./courier-dashboard.css']
})
export class CourierDashboard implements OnInit {
  sidebarCollapsed = false;
  courierPackages: Package[] = [];

  constructor(private packagesService: Packages) {} // Inject the PackagesService

  get loggedInCourierId(): string {
    const user = localStorage.getItem('dropsecure_user');
    if (!user) return '';
    try {
      const parsed = JSON.parse(user);
      return parsed?.id ?? '';
    } catch {
      return '';
    }
  }

  get loggedInCourierName(): string {
    const user = localStorage.getItem('dropsecure_user');
    if (!user) return '';
    try {
      const parsed = JSON.parse(user);
      return `${parsed.firstName ?? ''} ${parsed.lastName ?? ''}`.trim();
    } catch {
      return '';
    }
  }

  navItems = [
    { label: 'Dashboard', icon: 'home-outline', route: '/courier/dashboard', roles: ['COURIER'] },
    { label: 'Assignments', icon: 'mail-unread-outline', route: '/courier/assignments', roles: ['COURIER'] },
    { label: 'Route Planner', icon: 'navigate-outline', route: '/courier/route-planner', roles: ['COURIER'] },
    // { label: 'Earnings', icon: 'cash-outline', route: '/courier/earnings', roles: ['courier'] },
    // { label: 'Track', icon: 'locate-outline', route: '/courier/track', roles: ['courier', 'admin'] },
  ];

  ngOnInit() {
    const userStr = localStorage.getItem('dropsecure_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user) {
      this.packagesService.getUserPackages().subscribe(pkgs => {
        // Filter for packages assigned to this courier
        this.courierPackages = pkgs.filter(pkg => pkg.courierId === user.id);
      });
    }
  }
}
