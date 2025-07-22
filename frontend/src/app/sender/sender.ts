import { Component, OnInit } from '@angular/core';
import { ReviewForm } from './review-form/review-form';
import { PackageDetailModal } from './package-detail-modal/package-detail-modal';
import { PackageList } from './package-list/package-list';
import { DashboardCards } from './dashboard-cards/dashboard-cards';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Package } from '../models/package.model';
import { Packages, StatusEvent } from '../services/packages/packages';
import { Router } from '@angular/router';
import { Sidebar } from '../shared/sidebar/sidebar';
import { IonicModule } from '@ionic/angular';

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

  navItems = [
    { label: 'Dashboard', icon: 'home-outline', route: '/sender/dashboard', roles: ['sender'] },
    { label: 'My Packages', icon: 'cube-outline', route: '/sender/sent-packages', fragment: 'my-packages', roles: ['sender'] },
    { label: 'Received', icon: 'checkmark-done-outline', route: '/sender/received-packages', fragment: 'received', roles: ['sender'] },
    { label: 'Track', icon: 'locate-outline', route: '/sender/track', roles: ['sender', 'courier', 'admin'] },
  ];

  
}
