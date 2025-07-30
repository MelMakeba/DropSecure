import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Analysis } from '../../services/analysis/analysis';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar, IonicModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit {
  sidebarCollapsed = false;

  counts = {
    admins: 0,
    customers: 0,
    couriers: 0,
    packages: 0,
    activeDeliveries: 0,
    availableCouriers: 0,
    revenue: 0
  };

  get loggedInAdminName(): string {
    const userStr = localStorage.getItem('dropsecure_user');
    if (!userStr) return '';
    const user = JSON.parse(userStr);
    // Use firstName and lastName if available, fallback to email
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || '';
  }

  navItems = [
    { label: 'Dashboard', icon: 'home-outline', route: '/admin/dashboard', roles: ['ADMIN'] },
    { label: 'Packages', icon: 'cube-outline', route: '/admin/packages', roles: ['ADMIN'] },
    { label: 'Users', icon: 'people-outline', route: '/admin/users', roles: ['ADMIN'] },
    // { label: 'Couriers', icon: 'bicycle-outline', route: '/admin/couriers', roles: ['admin'] },
    // { label: 'Analytics', icon: 'stats-chart-outline', route: '/admin/analytics', roles: ['admin'] },
    // { label: 'Create Order', icon: 'add-circle-outline', route: '/admin/create-order', roles: ['admin'] }
  ];

  constructor(private analysis: Analysis) {}

  ngOnInit() {
    this.analysis.getCounts().subscribe(counts => {
      this.counts = counts;
    });
  }

  floor(value: number): number {
    return Math.floor(value);
  }
}
