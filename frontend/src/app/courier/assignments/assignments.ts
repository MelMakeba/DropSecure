import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Packages } from '../../services/packages/packages';
import { Package } from '../../models/package.model';
import { PackageDetailModal } from '../../sender/package-detail-modal/package-detail-modal';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { ConfirmationModal } from '../../shared/confirmation-modal/confirmation-modal';
import { IonicModule } from '@ionic/angular';
import { StatusHistory } from '../../services/StatusHistory/status-history'

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [CommonModule, PackageDetailModal, Sidebar, ConfirmationModal, IonicModule],
  templateUrl: './assignments.html',
  styleUrls: ['./assignments.css']
})
export class Assignments implements OnInit {
  assignments: Package[] = [];
  loading = true;
  showPackageModal = false;
  selectedPackage?: Package;

  constructor(private packagesService: Packages,
              private statusHistoryService: StatusHistory) {}

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
    alert(`Accepted assignment for ${pkg.trackingId}`);
  }

  decline(pkg: Package) {
    // Implement decline logic (API call or local update)
    alert(`Declined assignment for ${pkg.trackingId}`);
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
    { label: 'Dashboard', icon: 'home-outline', route: '/courier/dashboard', roles: ['COURIER'] },
    { label: 'Assignments', icon: 'mail-unread-outline', route: '/courier/assignments', roles: ['COURIER'] },
    { label: 'Route Planner', icon: 'navigate-outline', route: '/courier/route-planner', roles: ['COURIER'] },
    // { label: 'Earnings', icon: 'cash-outline', route: '/courier/earnings', roles: ['courier'] },
    // { label: 'Track', icon: 'locate-outline', route: '/courier/track', roles: ['courier', 'admin'] },
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
      alert(`Accepted assignment for ${this.pendingPackage.trackingId}`);
    } else if (this.confirmAction === 'decline' && this.pendingPackage) {
      // Decline logic here
      alert(`Declined assignment for ${this.pendingPackage.trackingId}`);
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
  changeStatus(pkg: Package, newStatus: string) {
    const user = localStorage.getItem('dropsecure_user');
    const courier = user ? JSON.parse(user) : { id: '', name: '' };
    this.statusHistoryService.changeStatus(
      pkg.id,
      newStatus,
      { id: courier.id, role: 'COURIER', name: courier.name },
      undefined,
      `Status changed to ${newStatus} by courier`
    ).subscribe(() => {
      // Refresh assignments or update UI as needed
      this.ngOnInit();
    });
}
}
