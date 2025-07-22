import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Packages, StatusEvent } from '../../services/packages/packages';
import { Package } from '../../models/package.model';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { RouterModule } from '@angular/router';
import { PackageDetailModal } from '../package-detail-modal/package-detail-modal';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-sent-packages',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterModule, PackageDetailModal],
  templateUrl: './sent-packages.html',
  styleUrls: ['./sent-packages.css'],
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
export class SentPackages implements OnInit {

      sidebarCollapsed = false;

  sentPackages: Package[] = [];
  loading = true;
    receivedPackages: Package[] = [];
    statusHistory: StatusEvent[] = [];
    showPackageModal = false;
    selectedPackage?: Package; // Use the Package model, optional property
  

  constructor(private packagesService: Packages) {}

  ngOnInit() {
    const user = localStorage.getItem('dropsecure_user');
    const senderId = user ? JSON.parse(user).id : '';
    if (senderId) {
      this.packagesService.getSentPackages(senderId).subscribe(pkgs => {
        this.sentPackages = pkgs;
        this.loading = false;
      });
    } else {
      this.loading = false;
    }
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


   navItems = [
    { label: 'Dashboard', icon: 'home-outline', route: '/sender/dashboard', roles: ['sender'] },
    { label: 'My Packages', icon: 'cube-outline', route: '/sender/dashboard', fragment: 'my-packages', roles: ['sender'] },
    { label: 'Received', icon: 'checkmark-done-outline', route: '/sender/dashboard', fragment: 'received', roles: ['sender'] },
    { label: 'Track', icon: 'locate-outline', route: '/sender/track', roles: ['sender', 'courier', 'admin'] },
  ];
}
