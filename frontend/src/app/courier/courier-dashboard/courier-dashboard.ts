import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-courier-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar, IonicModule],
  templateUrl: './courier-dashboard.html',
  styleUrls: ['./courier-dashboard.css']
})
export class CourierDashboard implements OnInit {
  sidebarCollapsed = false;

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
    return user ? JSON.parse(user).name : '';
  }

  navItems = [
    { label: 'Dashboard', icon: 'home-outline', route: '/courier/dashboard', roles: ['COURIER'] },
    { label: 'Assignments', icon: 'mail-unread-outline', route: '/courier/assignments', roles: ['COURIER'] },
    { label: 'Route Planner', icon: 'navigate-outline', route: '/courier/route-planner', roles: ['COURIER'] },
    // { label: 'Earnings', icon: 'cash-outline', route: '/courier/earnings', roles: ['courier'] },
    // { label: 'Track', icon: 'locate-outline', route: '/courier/track', roles: ['courier', 'admin'] },
  ];

  ngOnInit() {}
}
