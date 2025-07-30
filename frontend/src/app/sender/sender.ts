import { Component, OnInit } from '@angular/core';
import { ReviewForm } from './review-form/review-form';
import { PackageDetailModal } from './package-detail-modal/package-detail-modal';
import { PackageList } from './package-list/package-list';
import { DashboardCards } from './dashboard-cards/dashboard-cards';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Package } from '../models/package.model';
import { Packages } from '../services/packages/packages';
import { Router } from '@angular/router';
import { Sidebar } from '../shared/sidebar/sidebar';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../services/auth/auth';
import { StatusEvent } from '../models/status-event.model';
@Component({
  selector: 'app-sender',
  imports: [CommonModule, ReviewForm, PackageDetailModal, PackageList, DashboardCards, Sidebar, IonicModule], 
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
    private router: Router,
    private authService: AuthService
  ) {} 

  ngOnInit() {
    this.packageService.getUserPackages().subscribe((pkgs: Package[]) => {
      const user = this.authService.getCurrentUser();
      if (!user) return;
      this.sentPackages = pkgs.filter(pkg => pkg.senderId === user.id);
      this.receivedPackages = pkgs.filter(pkg => pkg.receiverEmail === user.email || pkg.receiverId === user.id);
    });
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
    return user ? JSON.parse(user).firstName : '';
  }

  logout() {
    localStorage.removeItem('dropsecure_user');
    window.location.href = '/';
  }

  navItems = [
    { label: 'Dashboard', icon: 'home-outline', route: '/sender/dashboard', roles: ['SENDER'] },
    { label: 'My Packages', icon: 'cube-outline', route: '/sender/sent-packages', fragment: 'my-packages', roles: ['SENDER'] },
    { label: 'Received', icon: 'checkmark-done-outline', route: '/sender/received-packages', fragment: 'received', roles: ['SENDER'] },
    { label: 'Track', icon: 'locate-outline', route: '/sender/track', roles: ['SENDER', 'COURIER', 'ADMIN'] },
  ];

  
}
