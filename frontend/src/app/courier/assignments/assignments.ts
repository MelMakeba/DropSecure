import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Packages } from '../../services/packages/packages';
import { Package } from '../../models/package.model';
import { PackageDetailModal } from '../../sender/package-detail-modal/package-detail-modal';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { ConfirmationModal } from '../../shared/confirmation-modal/confirmation-modal';

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [CommonModule, PackageDetailModal, Sidebar, ConfirmationModal],
  templateUrl: './assignments.html',
  styleUrls: ['./assignments.css']
})
export class Assignments implements OnInit {
  assignments: Package[] = [];
  loading = true;
  showPackageModal = false;
  selectedPackage?: Package;

  constructor(private packagesService: Packages) {}

  ngOnInit() {
    const user = localStorage.getItem('dropsecure_user');
    const courierId = user ? JSON.parse(user).id : '';
    if (courierId) {
      this.packagesService.getAssignmentsForCourier(courierId).subscribe(pkgs => {
        this.assignments = pkgs;
        this.loading = false;
      });
    } else {
      this.loading = false;
    }
  }

  accept(pkg: Package) {
    // Implement accept logic (API call or local update)
    alert(`Accepted assignment for ${pkg.trackingNumber}`);
  }

  decline(pkg: Package) {
    // Implement decline logic (API call or local update)
    alert(`Declined assignment for ${pkg.trackingNumber}`);
  }

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
    { label: 'Dashboard', icon: 'home-outline', route: '/courier/dashboard', roles: ['courier'] },
    { label: 'Assignments', icon: 'mail-unread-outline', route: '/courier/assignments', roles: ['courier'] },
    { label: 'Route Planner', icon: 'navigate-outline', route: '/courier/route-planner', roles: ['courier'] },
    { label: 'Earnings', icon: 'cash-outline', route: '/courier/earnings', roles: ['courier'] },
    { label: 'Track', icon: 'locate-outline', route: '/courier/track', roles: ['courier', 'admin'] },
    // Add more as needed
  ];

  showConfirmModal = false;
  confirmAction: 'accept' | 'decline' | null = null;
  pendingPackage: Package | null = null;

  openConfirm(action: 'accept' | 'decline', pkg: Package) {
    this.confirmAction = action;
    this.pendingPackage = pkg;
    this.showConfirmModal = true;
  }

  onConfirm() {
    if (this.confirmAction === 'accept' && this.pendingPackage) {
      // Accept logic here
      alert(`Accepted assignment for ${this.pendingPackage.trackingNumber}`);
    } else if (this.confirmAction === 'decline' && this.pendingPackage) {
      // Decline logic here
      alert(`Declined assignment for ${this.pendingPackage.trackingNumber}`);
    }
    this.showConfirmModal = false;
    this.confirmAction = null;
    this.pendingPackage = null;
  }

  onCancel() {
    this.showConfirmModal = false;
    this.confirmAction = null;
    this.pendingPackage = null;
  }
}
