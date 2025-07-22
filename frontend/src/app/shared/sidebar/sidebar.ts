import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';


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
  @Input() role: 'sender' | 'courier' | 'admin' = 'sender';
  @Input() loggedInName = '';
  @Input() navItems: SidebarNavItem[] = [];

  sidebarOpen = true;
  sidebarCollapsed = false;

  constructor(private router: Router) {}
   
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
}
