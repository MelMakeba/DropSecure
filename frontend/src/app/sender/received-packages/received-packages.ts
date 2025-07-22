import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Packages, StatusEvent } from '../../services/packages/packages';
import { Package } from '../../models/package.model';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { RouterModule } from '@angular/router';
import { PackageDetailModal } from '../package-detail-modal/package-detail-modal';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-received-packages',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterModule, PackageDetailModal],
  templateUrl: './received-packages.html',
  styleUrls: ['./received-packages.css'],
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
export class ReceivedPackages implements OnInit {

  sidebarCollapsed = false;
  receivedPackages: Package[] = [];
  loading = true;
  statusHistory: StatusEvent[] = [];
  showPackageModal = false;
  selectedPackage?: Package;

  loggedInSenderName = ''; // Set this as needed

  constructor(private packagesService: Packages) {}

  ngOnInit() {
    const user = localStorage.getItem('dropsecure_user');
    const receiverId = user ? JSON.parse(user).id : '';
    if (receiverId) {
      this.packagesService.getReceivedPackages(receiverId).subscribe(pkgs => {
        this.receivedPackages = pkgs;
        this.loading = false;
      });
    } else {
      this.loading = false;
    }
  }

  navItems = [
    { label: 'Dashboard', icon: 'home-outline', route: '/sender/dashboard', roles: ['sender'] },
    { label: 'My Packages', icon: 'cube-outline', route: '/sender/dashboard', fragment: 'my-packages', roles: ['sender'] },
    { label: 'Received', icon: 'checkmark-done-outline', route: '/sender/received-packages', fragment: 'received', roles: ['sender'] },
    { label: 'Track', icon: 'locate-outline', route: '/sender/track', roles: ['sender', 'courier', 'admin'] },
  ];
}
