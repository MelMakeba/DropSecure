import { Component, OnInit } from '@angular/core';
import { ReviewForm } from './review-form/review-form';
import { PackageDetailModal } from './package-detail-modal/package-detail-modal';
import { PackageStatusTimeline } from './package-status-timeline/package-status-timeline';
import { PackageList } from './package-list/package-list';
import { DashboardCards } from './dashboard-cards/dashboard-cards';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Package } from '../models/package.model';
import { Packages, StatusEvent } from '../services/packages/packages';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sender',
  imports: [CommonModule, ReviewForm, PackageDetailModal, PackageStatusTimeline, PackageList, DashboardCards], 
  templateUrl: './sender.html',
  styleUrls: ['./sender.css'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('200ms ease-in', style({ transform: 'translateX(0%)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(-100%)' }))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class Sender implements OnInit {
  sidebarOpen = true;
  sidebarCollapsed = false;

  headerHeight = 0;
  footerHeight = 0;

  sentPackages: Package[] = [];
  receivedPackages: Package[] = [];
  statusHistory: StatusEvent[] = [];
  showPackageModal = false;
  selectedPackage?: Package; // Use the Package model, optional property

  constructor(
    private packageService: Packages,
    private router: Router
  ) {} 

  ngOnInit() {
    const senderId = this.loggedInSenderId;
    this.packageService.getSentPackages(senderId).subscribe(pkgs => this.sentPackages = pkgs);
    this.packageService.getReceivedPackages(senderId).subscribe(pkgs => this.receivedPackages = pkgs);
  }

  get loggedInSenderId(): string {
    const user = localStorage.getItem('dropsecure_user');
    if (!user) return '';
    try {
      const parsed = JSON.parse(user);
      return parsed?.id ?? '';
    } catch {
      return '';
    }
  }

  get loggedInSenderName(): string {
    const user = localStorage.getItem('dropsecure_user');
    return user ? JSON.parse(user).name : '';
  }

  logout() {
    localStorage.removeItem('dropsecure_user');
    window.location.href = '/';
  }
  
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleSidebarCollapse() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  closeSidebarOnMobile() {
    if (window.innerWidth < 1200) {
      this.sidebarOpen = false;
    }
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  isActiveFragment(fragment: string): boolean {
    return this.router.url.includes(fragment);
  }
}
