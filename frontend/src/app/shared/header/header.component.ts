import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [RouterModule, CommonModule]
})
export class HeaderComponent {
  navLinks = [
    { label: 'Home', path: '/', exact: true },
    { label: 'About Us', path: '/about' },
    { label: 'Contact Us', path: '/contact' }
  ];

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('dropsecure_user');
  }

  get userName(): string {
    const user = localStorage.getItem('dropsecure_user');
    return user ? JSON.parse(user).name : '';
  }

  constructor(private router: Router) {}

  goToAbout() {
    this.router.navigate(['/about']);
  }
  goHome() {
    this.router.navigate(['/']);
  }
  logout() {
    localStorage.removeItem('dropsecure_user');
    this.router.navigate(['/']);
  }
}
