import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth/auth';
import { Router } from '@angular/router';
import { AnyUser, UserRole } from '../models/user.model';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-pages.html',
  styleUrls: ['./auth-pages.css']
})
export class AuthPages {
  @Input() mode: 'login' | 'register' | 'forgot' = 'login';
  @Input() show = false;
  @Output() close = new EventEmitter<void>();

  loading = signal(false);
  error = signal('');
  success = signal('');

  // Unified user object for forms
  user: Partial<AnyUser> = {
    role: 'customer'
  };
  roles: UserRole[] = ['customer', 'courier', 'admin'];

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
  
    this.loading.set(true);
    this.error.set('');
    this.success.set('');
    if (!this.user.email || !this.user.password) {
      this.error.set('Email and password are required');
      return;
    }
    this.authService.login(this.user.email as string, this.user.password as string).subscribe(res => {
      this.loading.set(false);
      if (res.success && res.user) {
      localStorage.setItem('dropsecure_user', JSON.stringify(res.user));
      this.success.set(res.message);
      // Redirect based on role
      if (res.user?.role === 'customer') {
        this.router.navigate(['/sender/dashboard']);
      } else if (res.user?.role === 'admin') {
        this.router.navigate(['/admin/dashboard']);
      } else if (res.user?.role === 'courier') {
        this.router.navigate(['/courier/dashboard']);
      }
      setTimeout(() => this.close.emit(), 1000);
      } else {
      this.error.set(res.message);
      }
    }, err => {
      this.loading.set(false);
      this.error.set('Network error');
    });
  }

  onRegister() {
    // Validate required fields based on role
    if (!this.user.email || !this.user.password || !this.user.name || !this.user.role) {
      this.error.set('Please fill all required fields');
      return;
    }
    if (this.user.role === 'customer' && !this.user.address) {
      this.error.set('Address is required for customers');
      return;
    }
    if (this.user.role === 'courier' && (!this.user.vehicleType || !this.user.licenseNumber || !this.user.zone)) {
      this.error.set('All courier fields are required');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.success.set('');
    this.authService.register(this.user as Partial<AnyUser> & { role: UserRole }).subscribe(res => {
      this.loading.set(false);
      if (res.success) {
        this.success.set(res.message);
        setTimeout(() => this.close.emit(), 1000);
      } else {
        this.error.set(res.message);
      }
    }, err => {
      this.loading.set(false);
      this.error.set('Network error');
    });
  }

  onForgot() {
    if (!this.user.email) {
      this.error.set('Email is required');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.success.set('Reset link sent!');
    setTimeout(() => {
      this.loading.set(false);
      this.close.emit();
    }, 1200);
  }
}
