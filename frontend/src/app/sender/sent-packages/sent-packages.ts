import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Packages } from '../../services/packages/packages';
import { Package } from '../../models/package.model';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { RouterModule } from '@angular/router';
import { PackageDetailModal } from '../package-detail-modal/package-detail-modal';
import { animate, style, transition, trigger } from '@angular/animations';
import { IonicModule } from '@ionic/angular';
import { StatusEvent } from '../../models/status-event.model';

@Component({
  selector: 'app-sent-packages',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterModule, PackageDetailModal, IonicModule],
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
    const userStr = localStorage.getItem('dropsecure_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user) {
      this.packagesService.getUserPackages().subscribe(pkgs => {
        // Filter for packages where the current user is the sender
        this.sentPackages = pkgs.filter(pkg =>
          pkg.senderId === user.id || pkg.senderEmail === user.email
        );
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
    { label: 'Dashboard', icon: 'home-outline', route: '/sender/dashboard', roles: ['SENDER'] },
    { label: 'My Packages', icon: 'cube-outline', route: '/sender/sent-packages', fragment: 'my-packages', roles: ['SENDER'] },
    { label: 'Received', icon: 'checkmark-done-outline', route: '/sender/received-packages', fragment: 'received', roles: ['SENDER'] },
    { label: 'Track', icon: 'locate-outline', route: '/sender/track', roles: ['SENDER', 'COURIER', 'ADMIN'] },
  ];

  onPackageClick(event: MouseEvent, pkg: Package) {
    event.stopPropagation();
    event.preventDefault(); // Optional, but helps if inside a link
    this.selectedPackage = pkg;
    this.showPackageModal = true;
  }
}
