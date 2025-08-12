import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
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
  @Input() show = false;
  @Input() mode: 'login' | 'register' | 'forgot' | 'verify' = 'login';
  @Output() close = new EventEmitter<void>();

  loading = signal(false);
  error = signal('');
  success = signal('');

  // Unified user object for forms
  user: Partial<AnyUser> = {
    role: 'SENDER',
    phone: '' // Add phone field
  };
  roles: UserRole[] = ['SENDER', 'COURIER', 'ADMIN'];
  verificationCode: string[] = Array(6).fill(''); 
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
        if (res.user.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/']);
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
    if (!this.user.email || !this.user.password || !this.user.firstName || !this.user.lastName || !this.user.role || !this.user.phone) {
      this.error.set('Please fill all required fields');
      return;
    }
    if (this.user.role === 'SENDER' && !this.user.address) {
      this.error.set('Address is required for customers');
      return;
    }
    if (this.user.role === 'COURIER' && (!this.user.vehicleType || !this.user.licenseNumber || !this.user.zone)) {
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
        // Switch to verification mode instead of closing
        this.mode = 'verify';
        // Store the email for verification
        localStorage.setItem('verification_email', this.user.email as string);
      } else {
        this.error.set(res.message);
      }
    }, err => {
      this.loading.set(false);
      this.error.set('Network error');
    });
  }
  
  // Add verification methods
  onVerify() {
    const code = this.verificationCode.join('');
    if (code.length !== 6) {
      this.error.set('Please enter a 6-digit code');
      return;
    }
    
    const email = localStorage.getItem('verification_email');
    if (!email) {
      this.error.set('Session expired. Please try registering again.');
      return;
    }
    
    this.loading.set(true);
    this.error.set('');
    this.success.set('');
    
    this.authService.verifyEmail(email, code).subscribe(res => {
      this.loading.set(false);
      if (res.success) {
        this.success.set('Account verified successfully!');
        localStorage.removeItem('verification_email');
        setTimeout(() => {
          this.close.emit();
          this.router.navigate(['/login']);
        }, 1000);
      } else {
        this.error.set(res.message || 'Verification failed');
      }
    }, err => {
      this.loading.set(false);
      this.error.set('Network error');
    });
  }
  
  resendCode() {
    const email = localStorage.getItem('verification_email');
    if (!email) {
      this.error.set('Session expired. Please try registering again.');
      return;
    }
    
    this.loading.set(true);
    this.error.set('');
    
    this.authService.resendVerification(email).subscribe(res => {
      this.loading.set(false);
      if (res.success) {
        this.success.set('New verification code sent!');
      } else {
        this.error.set(res.message || 'Failed to resend code');
      }
    }, err => {
      this.loading.set(false);
      this.error.set('Network error');
    });
  }
  
  // Add input handling for the verification code
  onCodeInput(event: any, index: number) {
    const input = event.target;
    const value = input.value;
    
    // Update the verification code array
    this.verificationCode[index] = value;
    
    // Auto-focus next input if value is entered
    if (value && index < 5) {
      const nextInput = event.target.parentElement.children[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onCodeBackspace(event: any, index: number) {
    // If backspace is pressed and current input is empty, focus previous input
    if (event.target.value === '' && index > 0) {
      const prevInput = event.target.parentElement.children[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
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
