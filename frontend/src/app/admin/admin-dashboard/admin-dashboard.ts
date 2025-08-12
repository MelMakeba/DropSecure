import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { AdminDashboardService, AdminDashboardStats } from '../../services/dashboards/admin/admin-dashboard';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar, IonicModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit, OnDestroy {
  sidebarCollapsed = false;
  loading = true;
  error: string | null = null;
  
  private subscriptions = new Subscription();

  // Dashboard stats
  stats: AdminDashboardStats | null = null;
  
  // Computed counts for display
  counts = {
    admins: 0,
    customers: 0,
    couriers: 0,
    packages: 0,
    activeDeliveries: 0,
    availableCouriers: 0,
    revenue: 0
  };

  // Additional dashboard data
  recentPackages: any[] = [];
  packageStatusBreakdown: { status: string; count: number }[] = [];
  monthlyRevenue: { month: string; revenue: number }[] = [];
  topCouriers: { id: string; name: string; deliveries: number }[] = [];

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
    { label: 'Contact Forms', icon: 'mail-outline', route: '/admin/contacts', roles: ['ADMIN'] },
    // { label: 'Couriers', icon: 'bicycle-outline', route: '/admin/couriers', roles: ['ADMIN'] },
    // { label: 'Analytics', icon: 'stats-chart-outline', route: '/admin/analytics', roles: ['ADMIN'] },
    // { label: 'Create Order', icon: 'add-circle-outline', route: '/admin/create-order', roles: ['ADMIN'] }
  ];

  constructor(private adminDashboardService: AdminDashboardService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadDashboardData() {
    this.loading = true;
    this.error = null;

    const statsSubscription = this.adminDashboardService.getAdminDashboardStats().subscribe({
      next: (stats) => {
        console.log('Dashboard data received:', stats);
        
        // Use stats directly since it's already AdminDashboardStats
        this.stats = stats;
        this.updateCounts(stats);
        this.updateDashboardData(stats);
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load admin dashboard stats:', error);
        this.error = 'Failed to load dashboard data. Please try again.';
        this.loading = false;
      }
    });

    this.subscriptions.add(statsSubscription);
  }

  private updateCounts(stats: AdminDashboardStats) {
    this.counts = {
      admins: this.getAdminCount(stats), // Will need to calculate from total users
      customers: stats.totalSenders ?? 0,
      couriers: stats.totalCouriers ?? 0,
      packages: stats.totalPackages ?? 0,
      activeDeliveries: stats.activePackages ?? 0,
      availableCouriers: stats.availableCouriers ?? 0,
      revenue: Math.floor(stats.totalRevenue ?? 0)
    };
  }

  private updateDashboardData(stats: AdminDashboardStats) {
    // Recent packages - handle undefined/null
    this.recentPackages = (stats.recentPackages && Array.isArray(stats.recentPackages)) 
      ? stats.recentPackages.slice(0, 5) 
      : [];

    // Package status breakdown for charts
    this.packageStatusBreakdown = stats.packageStatusBreakdown 
      ? Object.entries(stats.packageStatusBreakdown).map(([status, count]) => ({ status, count }))
      : [];

    // Monthly revenue - handle undefined/null
    this.monthlyRevenue = (stats.monthlyRevenue && Array.isArray(stats.monthlyRevenue)) 
      ? stats.monthlyRevenue 
      : [];

    // Top couriers - handle undefined/null
    this.topCouriers = (stats.topCouriers && Array.isArray(stats.topCouriers)) 
      ? stats.topCouriers 
      : [];
  }

  private getAdminCount(stats: AdminDashboardStats): number {
    // Calculate admin count from total users minus couriers and senders
    const totalSenders = stats.totalSenders ?? 0;
    const totalCouriers = stats.totalCouriers ?? 0;
    const totalUsers = stats.totalUsers ?? 0;
    
    return totalUsers - totalCouriers - totalSenders;
  }

  // Utility methods
  floor(value: number): number {
    return Math.floor(value);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'PENDING': 'warning',
      'COURIER_ASSIGNED': 'primary',
      'PICKED_UP': 'secondary',
      'IN_TRANSIT': 'tertiary',
      'OUT_FOR_DELIVERY': 'success',
      'DELIVERED': 'success',
      'CANCELLED': 'danger',
      'RETURNED': 'medium'
    };
    return statusColors[status] || 'medium';
  }

  getRevenueGrowth(): number {
    if (this.monthlyRevenue.length < 2) return 0;
    
    const currentMonth = this.monthlyRevenue[this.monthlyRevenue.length - 1];
    const previousMonth = this.monthlyRevenue[this.monthlyRevenue.length - 2];
    
    if (previousMonth.revenue === 0) return 100;
    
    return ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100;
  }

  getPackageGrowth(): number {
    // This would require historical package data
    // For now, return a placeholder
    return 12.5;
  }

  // Action methods
  onRefreshData() {
    this.loadDashboardData();
  }

  onViewAllPackages() {
    // Navigate to packages page
  }

  onViewAllUsers() {
    // Navigate to users page
  }

  onViewPackage(packageId: string) {
    // Navigate to package details
  }

  onViewCourier(courierId: string) {
    // Navigate to courier details
  }

  // Chart data getters for template
  getChartData() {
    return {
      labels: this.packageStatusBreakdown.map(item => item.status),
      datasets: [{
        data: this.packageStatusBreakdown.map(item => item.count),
        backgroundColor: [
          '#3880ff',
          '#10dc60',
          '#ffce00',
          '#f04141',
          '#7044ff',
          '#36c6c6'
        ]
      }]
    };
  }

  getRevenueChartData() {
    return {
      labels: this.monthlyRevenue.map(item => item.month),
      datasets: [{
        label: 'Revenue',
        data: this.monthlyRevenue.map(item => item.revenue),
        borderColor: '#3880ff',
        backgroundColor: 'rgba(56, 128, 255, 0.1)',
        fill: true
      }]
    };
  }
}
