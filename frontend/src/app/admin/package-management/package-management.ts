import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Package } from '../../models/package.model';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { IonicModule } from '@ionic/angular';
import { FormsModule, NgForm } from '@angular/forms';
import { ConfirmationModal } from '../../shared/confirmation-modal/confirmation-modal';
import { PackageDetailModal } from '../../sender/package-detail-modal/package-detail-modal';
import { StatusEvent } from '../../models/status-event.model';
import { AdminDashboardService, User } from '../../services/dashboards/admin/admin-dashboard';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-package-management',
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule, Sidebar, FormsModule, ConfirmationModal, PackageDetailModal],
  templateUrl: './package-management.html',
  styleUrls: ['./package-management.css']
})
export class PackageManagement implements OnInit, OnDestroy {
  packages: Package[] = [];
  loading = false;
  error: string | null = null;
  sidebarCollapsed = false;
  showCreateModal = false;
  showDeleteModal = false;
  showAssignModal = false;
  showDetailsModal = false;

  @ViewChild('createForm') createForm!: NgForm;

  private subscriptions = new Subscription();

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;

  // Filters
  statusFilter = '';
  searchTerm = '';
  courierFilter = '';

  newPackage: Partial<Package> = {
    senderEmail: '',
    receiverName: '',
    receiverEmail: '',
    receiverPhone: '',
    receiverAddress: '',
    receiverCity: '',
    receiverState: '',
    receiverZipCode: '',
    receiverCountry: '',
    weight: undefined,
    description: '',
    specialInstructions: '',
    value: undefined,
    price: undefined,
    preferredPickupDate: '',
    preferredDeliveryDate: '',
  };

  editMode = false;
  selectedPackageId: string | null = null;
  packageIdToDelete: string | null = null;
  packageIdToAssign: string | null = null;
  selectedCourierId: string | null = null;
  selectedPackage: Package | undefined = undefined;
  selectedPackageStatusHistory: StatusEvent[] = [];
  couriers: User[] = [];

  packageStats: {
    totalPackages: number;
    pendingPackages: number;
    inTransitPackages: number;
    deliveredPackages: number;
    cancelledPackages: number;
    totalRevenue: number;
  } = {
    totalPackages: 0,
    pendingPackages: 0,
    inTransitPackages: 0,
    deliveredPackages: 0,
    cancelledPackages: 0,
    totalRevenue: 0
  };

  constructor(private adminDashboardService: AdminDashboardService) {}

  ngOnInit() {
    this.loadPackages();
    this.loadCouriers();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadPackages() {
    this.loading = true;
    this.error = null;

    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      ...(this.statusFilter && { status: this.statusFilter }),
      ...(this.searchTerm && { search: this.searchTerm })
    };

    const packagesSubscription = this.adminDashboardService.getAllPackages(params).subscribe({
      next: (response) => {
        console.log('Packages response:', response); // Debug log
        
        // Handle both wrapped and direct response formats
        if (response && response.data) {
          // API returns wrapped response: { message: "", data: [...] }
          this.packages = Array.isArray(response.data) ? response.data : [];
          this.totalItems = response.total || response.data.length || 0;
          this.totalPages = response.totalPages || Math.ceil(this.totalItems / this.itemsPerPage);
        } else if (Array.isArray(response)) {
          // API returns direct array
          this.packages = response;
          this.totalItems = response.length;
          this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        } else {
          // Fallback for unexpected response format
          console.warn('Unexpected response format:', response);
          this.packages = [];
          this.totalItems = 0;
          this.totalPages = 0;
        }
        
        this.loading = false;
        this.calculatePackageStats();
      },
      error: (error) => {
        console.error('Failed to load packages:', error);
        this.error = 'Failed to load packages. Please try again.';
        this.loading = false;
        
        // Set empty state on error
        this.packages = [];
        this.totalItems = 0;
        this.totalPages = 0;
      }
    });

    this.subscriptions.add(packagesSubscription);
  }

  loadCouriers() {
    const couriersSubscription = this.adminDashboardService.getAllCouriers().subscribe({
      next: (couriers) => {
        this.couriers = couriers;
      },
      error: (error) => {
        console.error('Failed to load couriers:', error);
      }
    });

    this.subscriptions.add(couriersSubscription);
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadPackages();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadPackages();
  }

  onSearch() {
    this.currentPage = 1;
    this.loadPackages();
  }

  clearFilters() {
    this.statusFilter = '';
    this.searchTerm = '';
    this.courierFilter = '';
    this.currentPage = 1;
    this.loadPackages();
  }

  submitCreatePackage(form: NgForm) {
    if (form.valid) {
      if (this.editMode && this.selectedPackageId) {
        this.editPackage(this.selectedPackageId, this.newPackage);
      } else {
        const pkg: any = {
          ...this.newPackage,
          status: 'PENDING',
          isPaid: false,
        };
        this.createPackage(pkg);
      }
      this.closeCreateModal();
      this.resetNewPackage();
      if (this.createForm) {
        this.createForm.resetForm();
      }
    }
  }

  createPackage(pkg: any) {
    const createSubscription = this.adminDashboardService.createPackage(pkg).subscribe({
      next: (createdPkg) => {
        console.log('Package created successfully');
        this.loadPackages();
      },
      error: (err) => {
        console.error('Failed to create package:', err);
        this.error = 'Failed to create package. Please try again.';
      }
    });

    this.subscriptions.add(createSubscription);
  }

  editPackage(packageId: string, pkg: Partial<Package>) {
    
    const updateSubscription = this.adminDashboardService.updatePackageStatus(packageId, {
      status: pkg.status || 'PENDING',
      notes: 'Package updated by admin'
    }).subscribe({
      next: () => {
        console.log('Package updated successfully');
        this.loadPackages();
      },
      error: (err) => {
        console.error('Failed to update package:', err);
        this.error = 'Failed to update package. Please try again.';
      }
    });

    this.subscriptions.add(updateSubscription);
  }

  updateStatus(packageId: string, status: string) {
    const updateSubscription = this.adminDashboardService.updatePackageStatus(packageId, {
      status,
      notes: `Status updated to ${status} by admin`
    }).subscribe({
      next: () => {
        console.log('Package status updated successfully');
        this.loadPackages();
      },
      error: (err) => {
        console.error('Failed to update package status:', err);
        this.error = 'Failed to update package status. Please try again.';
      }
    });

    this.subscriptions.add(updateSubscription);
  }

  assignToCourier(packageId: string, courierId: string) {
    const assignSubscription = this.adminDashboardService.assignCourierToPackage(packageId, courierId).subscribe({
      next: () => {
        console.log('Courier assigned successfully');
        this.loadPackages();
      },
      error: (err) => {
        console.error('Failed to assign courier:', err);
        this.error = 'Failed to assign courier. Please try again.';
      }
    });

    this.subscriptions.add(assignSubscription);
  }

  cancelPackage(packageId: string) {
    const cancelSubscription = this.adminDashboardService.cancelPackage(packageId).subscribe({
      next: () => {
        console.log('Package cancelled successfully');
        this.loadPackages();
      },
      error: (err) => {
        console.error('Failed to cancel package:', err);
        this.error = 'Failed to cancel package. Please try again.';
      }
    });

    this.subscriptions.add(cancelSubscription);
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.editMode = false;
    this.selectedPackageId = null;
    this.resetNewPackage();
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.error = null;
  }

  openEditModal(pkg: Package) {
    this.showCreateModal = true;
    this.editMode = true;
    this.selectedPackageId = pkg.id;
    this.newPackage = { ...pkg };
  }

  openDeleteModal(packageId: string) {
    this.packageIdToDelete = packageId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.packageIdToDelete = null;
  }

  confirmDeletePackage() {
    if (this.packageIdToDelete) {
      this.cancelPackage(this.packageIdToDelete);
      this.closeDeleteModal();
    }
  }

  openAssignModal(packageId: string) {
    this.packageIdToAssign = packageId;
    this.showAssignModal = true;
    this.selectedCourierId = null;
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.packageIdToAssign = null;
    this.selectedCourierId = null;
  }

  assignPackageToCourier() {
    if (this.packageIdToAssign && this.selectedCourierId) {
      this.assignToCourier(this.packageIdToAssign, this.selectedCourierId);
      this.closeAssignModal();
    }
  }

  openDetailsModal(pkg: Package) {
    this.selectedPackage = pkg;
    this.showDetailsModal = true;
    
    // Load package details
    const detailsSubscription = this.adminDashboardService.getPackageById(pkg.id).subscribe({
      next: (packageDetails) => {
        this.selectedPackage = packageDetails;
        // Note: You might need to add a method to get status history
        this.selectedPackageStatusHistory = packageDetails.statusHistory || [];
      },
      error: (err) => {
        console.error('Failed to load package details:', err);
      }
    });

    this.subscriptions.add(detailsSubscription);
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedPackage = undefined;
    this.selectedPackageStatusHistory = [];
  }

  markAsPickedUp(pkg: Package) {
    this.updateStatus(pkg.id, 'PICKED_UP');
  }

  resetNewPackage() {
    this.newPackage = {
      senderEmail: '',
      receiverName: '',
      receiverEmail: '',
      receiverPhone: '',
      receiverAddress: '',
      receiverCity: '',
      receiverState: '',
      receiverZipCode: '',
      receiverCountry: '',
      weight: undefined,
      description: '',
      specialInstructions: '',
      value: undefined,
      price: undefined,
      preferredPickupDate: '',
      preferredDeliveryDate: '',
    };
  }

  get loggedInAdminName(): string {
    const userStr = localStorage.getItem('dropsecure_user');
    if (!userStr) return '';
    const user = JSON.parse(userStr);
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || '';
  }

  navItems = [
    { label: 'Dashboard', icon: 'home-outline', route: '/admin/dashboard', roles: ['ADMIN'] },
    { label: 'Packages', icon: 'cube-outline', route: '/admin/packages', roles: ['ADMIN'] },
    { label: 'Users', icon: 'people-outline', route: '/admin/users', roles: ['ADMIN'] },
    { label: 'Contact Forms', icon: 'mail-outline', route: '/admin/contacts', roles: ['ADMIN'] },
  ];

  // Stats methods for display
  getPendingCount(): number {
    return this.packages.filter(pkg => pkg.status === 'PENDING').length;
  }

  getInTransitCount(): number {
    return this.packages.filter(pkg => 
      ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(pkg.status)
    ).length;
  }

  getDeliveredCount(): number {
    return this.packages.filter(pkg => pkg.status === 'DELIVERED').length;
  }

  // Utility methods
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Pagination helper
  getPaginationArray(): number[] {
    const pages = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Add this method to calculate package stats
  private calculatePackageStats() {
    if (!this.packages || !Array.isArray(this.packages)) {
      this.packageStats = {
        totalPackages: 0,
        pendingPackages: 0,
        inTransitPackages: 0,
        deliveredPackages: 0,
        cancelledPackages: 0,
        totalRevenue: 0
      };
      return;
    }

    this.packageStats = {
      totalPackages: this.packages.length,
      pendingPackages: this.packages.filter(pkg => ['CREATED', 'PENDING'].includes(pkg.status)).length,
      inTransitPackages: this.packages.filter(pkg => ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(pkg.status)).length,
      deliveredPackages: this.packages.filter(pkg => pkg.status === 'DELIVERED').length,
      cancelledPackages: this.packages.filter(pkg => pkg.status === 'CANCELLED').length,
      totalRevenue: this.packages.reduce((sum, pkg) => sum + (pkg.price || 0), 0)
    };
  }
}
