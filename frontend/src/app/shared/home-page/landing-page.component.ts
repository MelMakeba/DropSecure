import { Component, signal } from '@angular/core';
import { AuthPages } from '../../auth-pages/auth-pages';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [AuthPages, IonicModule, CommonModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent {

  showAuth = signal(false);
  authMode = signal<'login'|'register'|'forgot'>('login');

  constructor( private router: Router ) {}
  
  openAuth( mode: 'login' | 'register' | 'forgot' = 'login' ) {
    this.authMode.set(mode);
    this.showAuth.set(true);
  }

  closeAuth() {
    this.showAuth.set(false);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('dropsecure_user');
  }

  goToDashboard() {
    console.log('Go to Dashboard clicked');
    const user = localStorage.getItem('dropsecure_user');
    if (user) {
      const parsed = JSON.parse(user);
      if (parsed.role === 'ADMIN') {
        this.router.navigate(['/admin/dashboard']);
      } else if (parsed.role === 'COURIER') {
        this.router.navigate(['/courier/dashboard']);
      } else if (parsed.role === 'SENDER') {
        this.router.navigate(['/sender/dashboard']);
      } else {
        this.router.navigate(['/']);
      }
    }
  }
}
