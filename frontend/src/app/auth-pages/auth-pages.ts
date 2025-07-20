import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  // For demo, simple state
  loading = signal(false);
  error = signal('');
  success = signal('');

  // Demo handlers
  onLogin() {
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.success.set('Login successful!');
      setTimeout(() => this.close.emit(), 1000);
    }, 1200);
  }
  onRegister() {
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.success.set('Registration successful!');
      setTimeout(() => this.close.emit(), 1000);
    }, 1200);
  }
  onForgot() {
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.success.set('Reset link sent!');
      setTimeout(() => this.close.emit(), 1000);
    }, 1200);
  }
}
