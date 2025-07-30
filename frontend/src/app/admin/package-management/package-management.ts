import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Packages } from '../../services/packages/packages';
import { RouterModule } from '@angular/router';
import { Package } from '../../models/package.model';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { IonicModule } from '@ionic/angular';
import { FormsModule, NgForm } from '@angular/forms';
import { ConfirmationModal } from '../../shared/confirmation-modal/confirmation-modal';
import { PackageDetailModal } from '../../sender/package-detail-modal/package-detail-modal';
import { StatusHistory } from '../../services/StatusHistory/status-history'
import { StatusEvent } from '../../models/status-event.model';
@Component({
  selector: 'app-package-management',
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule, Sidebar, FormsModule, ConfirmationModal, PackageDetailModal],
  templateUrl: './package-management.html',
  styleUrls: ['./package-management.css']
})
export class PackageManagement {
  packages: Package[] = [];
  loading = false;
  sidebarCollapsed = false;
  showCreateModal = false;
  showDeleteModal = false;
  showAssignModal = false;
  showDetailsModal = false;

  @ViewChild('createForm') createForm!: NgForm;

  constructor(private packagesService: Packages,
    private statusHistoryService: StatusHistory
  ) {
    this.loadPackages();
  }

  newPackage: Partial<Package> = {
    trackingId: '',
    senderId: '',
    senderName: '',
    senderEmail: '',
    senderPhone: '',
    senderAddress: '',
    receiverId: '',
    receiverName: '',
    receiverEmail: '',
    receiverPhone: '',
    receiverAddress: '',
    weight: undefined,
    description: '',
    specialInstructions: '',
    value: undefined,
    price: undefined,
    preferredPickupDate: '',
    preferredDeliveryDate: '',
    status: '',
    isPaid: false,
    createdById: '',
    createdAt: '',
    updatedAt: ''
  };

  editMode = false;
  selectedPackageId: string | null = null;
  packageIdToDelete: string | null = null;
  packageIdToAssign: string | null = null;
  selectedCourierId: string | null = null;
  selectedPackage: Package | undefined = undefined;
  selectedPackageStatusHistory: StatusEvent[] = [];
  couriers: { id: string; name: string }[] = []; // Adjust type as per your model

  submitCreatePackage(form: NgForm) {
    if (form.valid) {
      if (this.editMode && this.selectedPackageId) {
        this.editPackage(this.selectedPackageId, this.newPackage);
      } else {
        const pkg: Partial<Package> = {
          ...this.newPackage,
          status: 'pending',
          isPaid: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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

  loadPackages() {
    this.loading = true;
    this.packagesService.getPackages().subscribe(pkgs => {
      this.packages = pkgs.map(pkg => ({
        ...pkg,
        senderName: pkg.sender
          ? `${pkg.sender.firstName} ${pkg.sender.lastName}`
          : pkg.senderName || '',
        courierName: pkg.courier
          ? `${pkg.courier.firstName} ${pkg.courier.lastName}`
          : pkg.courierName || ''
      }));
      this.loading = false;
    });
  }

  updateStatus(packageId: string, status: string) {
    this.packagesService.updatePackageStatus(packageId, status).subscribe(() => {
      this.loadPackages();
    });
  }

  assignToCourier(packageId: string, courierId: string, courierName: string) {
    this.packagesService.assignPackageToCourier(packageId, courierId).subscribe(() => {
      this.loadPackages();
    });
  }

  createPackage(pkg: Partial<Package>) {
    this.packagesService.createPackage(pkg).subscribe({
      next: (createdPkg) => {
        // Optionally handle the created package (e.g., show a success message)
        this.loadPackages(); // Refresh the list after creation
      },
      error: (err) => {
        // Handle error (e.g., show an error message)
        console.error('Failed to create package:', err);
      }
    });
  }

  editPackage(packageId: string, pkg: Partial<Package>) {
    this.packagesService.editPackage(packageId, pkg).subscribe(() => {
      this.loadPackages();
    });
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.editMode = false;
    this.selectedPackageId = null;
    this.newPackage = {
      trackingId: '',
      senderId: '',
      senderName: '',
      senderEmail: '',
      senderPhone: '',
      senderAddress: '',
      receiverId: '',
      receiverName: '',
      receiverEmail: '',
      receiverPhone: '',
      receiverAddress: '',
      weight: undefined,
      description: '',
      specialInstructions: '',
      value: undefined,
      price: undefined,
      preferredPickupDate: '',
      preferredDeliveryDate: '',
      status: '',
      isPaid: false,
      createdById: '',
      createdAt: '',
      updatedAt: ''
    };
  }

  closeCreateModal() {
    this.showCreateModal = false;
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
      this.packagesService.deletePackage(this.packageIdToDelete).subscribe(() => {
        this.loadPackages();
        this.closeDeleteModal();
      });
    }
  }

  openAssignModal(packageId: string) {
    this.packageIdToAssign = packageId;
    this.showAssignModal = true;
    this.selectedCourierId = null;
    this.loadCouriers();
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.packageIdToAssign = null;
    this.selectedCourierId = null;
  }

  assignPackageToCourier() {
    if (this.packageIdToAssign && this.selectedCourierId) {
      const courier = this.couriers.find(c => c.id === this.selectedCourierId);
      this.packagesService.assignPackageToCourier(
        this.packageIdToAssign,
        this.selectedCourierId
      ).subscribe(() => {
        this.loadPackages();
        this.closeAssignModal();
      });
    }
  }

  loadCouriers() {
    this.packagesService.getCouriers().subscribe(couriers => {
      this.couriers = couriers;
    });
  }

  get loggedInAdminName(): string {
    const user = localStorage.getItem('dropsecure_user');
    return user ? JSON.parse(user).name : '';
  }

 
  navItems = [
    { label: 'Dashboard', icon: 'home-outline', route: '/admin/dashboard', roles: ['ADMIN'] },
    { label: 'Packages', icon: 'cube-outline', route: '/admin/packages', roles: ['ADMIN'] },
    { label: 'Users', icon: 'people-outline', route: '/admin/users', roles: ['ADMIN'] },
    // { label: 'Couriers', icon: 'bicycle-outline', route: '/admin/couriers', roles: ['admin'] },
    // { label: 'Analytics', icon: 'stats-chart-outline', route: '/admin/analytics', roles: ['admin'] },
    // { label: 'Create Order', icon: 'add-circle-outline', route: '/admin/create-order', roles: ['admin'] }
  ];

  getPendingCount(): number {
    return this.packages.filter(pkg => pkg.status === 'pending').length;
  }

  getInTransitCount(): number {
    return this.packages.filter(pkg => pkg.status === 'in-transit').length;
  }

  getDeliveredCount(): number {
    return this.packages.filter(pkg => pkg.status === 'delivered').length;
  }

  openDetailsModal(pkg: Package) {
    this.selectedPackage = pkg;
    this.showDetailsModal = true;
    this.statusHistoryService.getStatusHistory(pkg.id).subscribe(history => {
      this.selectedPackageStatusHistory = history;
    });
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedPackage = undefined;
    this.selectedPackageStatusHistory = [];
  }

  markAsPickedUp(pkg: Package) {
    const user = localStorage.getItem('dropsecure_user');
    const admin = user ? JSON.parse(user) : { id: '', name: '' };
    this.statusHistoryService.changeStatus(
      pkg.id,
      'picked_up',
      { id: admin.id, role: 'ADMIN', name: admin.name },
      undefined,
      'Marked as picked up by admin'
    ).subscribe(() => {
      this.loadPackages();
    });
  }

  resetNewPackage() {
    this.newPackage = {
      trackingId: '',
      senderId: '',
      senderName: '',
      senderEmail: '',
      senderPhone: '',
      senderAddress: '',
      receiverId: '',
      receiverName: '',
      receiverEmail: '',
      receiverPhone: '',
      receiverAddress: '',
      weight: undefined,
      description: '',
      specialInstructions: '',
      value: undefined,
      price: undefined,
      preferredPickupDate: '',
      preferredDeliveryDate: '',
      status: '',
      isPaid: false,
      createdById: '',
      createdAt: '',
      updatedAt: ''
    };
  }
}
