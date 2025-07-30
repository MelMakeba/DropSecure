import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth/auth'; // Import AuthService
import { UserRole } from '../../models/user.model';


export interface SidebarNavItem {
  label: string;
  icon: string; // SVG or Ionicon name
  route: string;
  fragment?: string;
  roles: string[]; // e.g. ['sender', 'courier', 'admin']
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
export class Sidebar {
  @Input() navItems: SidebarNavItem[] = [];
  @Input() role!: UserRole;
  @Input() loggedInName!: string;

  sidebarOpen = true;
  sidebarCollapsed = false;

  user: any;

  constructor(private router: Router, private authService: AuthService) {
    this.user = this.authService.getCurrentUser();
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

  isActive(route: string) {
    return this.router.url === route;
  }

  isActiveFragment(fragment: string) {
    return this.router.url.includes(fragment);
  }

  get loggedInSenderId(): string {
    return this.user?.id ?? '';
  }

  logout() {
    this.authService.logout();
  }

  get sidebarHeight(): string {
    // 60rem for admin and courier, default (auto) for sender
    return (this.role === 'ADMIN' || this.role === 'COURIER') ? '50rem' : 'auto';
  }
}
